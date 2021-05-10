'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

//? Project Architecture

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; //! [LAT, LNG]
    this.distance = distance; //! in km
    this.duration = duration; //! in min
  }
}

//* child class
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    //* min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
  }

  calcSpeed() {
    //* km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 95, 568);

////////////////////////////////!
//! APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class App {
  //! private
  _map;
  _mapEvent;
  _workouts = [];

  constructor() {
    //! constructor will immmediately called when the new Object is created
    this._getPositions();

    //? RENDER map marker
    form.addEventListener('submit', this._newWorkout.bind(this));

    //* handle input select -> change between running and cycling
    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPositions() {
    //* Geolocation API
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('sorry, cannot get yoour current current location!');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this._map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this._map);

    //! handling click on map
    this._map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this._mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus(); // pointing to focus typing inpu
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // every method -> return true if all of them is true
    // return false if there is one elem is false
    // opposite method is some()
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const positiveInputs = (...inputs) => inputs.every(inp => inp > 0);

    //* GET DATA FROM THE FORM
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this._mapEvent.latlng;
    // fix the scope variable problem
    let workout;

    //* IF ACTIVITY IS RUNNING, CREATE RUNNING OBJECT
    if (type === 'running') {
      //! CHECK IF DATA IS VALID
      const cadence = +inputCadence.value;
      if (
        // not number == true
        !validInputs(distance, duration, cadence) ||
        !positiveInputs(distance, duration, cadence)
      )
        return alert('Inputs has to be a positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //* IF CYCLING IS RUNNING, CREATE CYCLING OBJECT
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        // not number == true
        !validInputs(distance, duration, elevation) ||
        !positiveInputs(distance, duration)
      )
        return alert('Inputs has to be a positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //* ADD NEW OBJECT TO WORKOUT ARRAY
    this._workouts.push(workout);
    console.log(workout);

    //* RENDER WORKOUT ON MAP AS A MARKER
    this.renderWorkoutMarker(workout);

    //* RENDER WORKOUT ON LIST

    //* HIDE FORM + clear input fields
    inputDistance.value = inputDuration.value = inputCadence.value = '';
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this._map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 180,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('Workout Schedule')
      .openPopup();
  }
}

const app = new App();
