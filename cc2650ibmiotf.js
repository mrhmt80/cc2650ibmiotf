var async = require('async');
var Client = require('ibmiotf');
var sensorTag = require('sensortag');

var config = {
  'org': 'a5vgz2',           // change this to your own org
  'id': 'k34CC2650',         // change this to your own device id
  'type': 'CC2650',          // change this to your own device type
  'auth-method': 'token',
  'auth-token': '1221080932' // change this to your own token
};

var payload = {
  'ambientTemperature': null,
  'humidity': null,
  'light': null,
  'objectTemperature': null,
  'pressure': null,
  'temperature': null,
  'time': null
};

var deviceClient = new Client.IotfDevice(config);

deviceClient.connect();

deviceClient.on('connect', function() {
  sensorTag.discover(function(sensorTag) {
    console.log('discovered: ' + sensorTag);
    setupMeasure(sensorTag);
  });
});

deviceClient.on('error', function (err) {
  console.log('Error: ' + err);
});

function setupMeasure(st) {
  async.series([
    function(callback) {
      st.connectAndSetup(callback);
    },
    function(callback) {
      console.log('enableBarometricPressure');
      st.enableBarometricPressure(callback);
    },
    function(callback) {
      console.log('enableHumidity');
      st.enableHumidity(callback);
    },
    function(callback) {
      console.log('enableIrTemperature');
      st.enableIrTemperature(callback);
    },
    function(callback) {
      console.log('enableLuxometer');
      st.enableLuxometer(callback);
    },
    function(callback) {
      setTimeout(callback, 2000);
    },
    function(callback) {
      startMeasure(st);
    }
  ]);
}
function startMeasure(st) {
  measure(st);
  setTimeout(function() {
    startMeasure(st);
  }, 5000);
}
function measure(st) {
  console.log('measure');
  async.series([
    function(callback) {
      console.log('readBarometricPressure');
      st.readBarometricPressure(function(error, pressure) {
        console.log('pressure: %d hPa', pressure);
        payload.pressure = pressure;
        callback();
      });
    },
    function(callback) {
      console.log('readHumidity');
      st.readHumidity(function(error, temperature, humidity) {
        console.log('humidity: %d %', humidity);
        payload.humidity = humidity;
        console.log('temperature: %d °C', temperature);
        payload.temperature = temperature;
        callback();
      });
    },
    function(callback) {
      console.log('readIrTemperature');
      st.readIrTemperature(function(error, objectTemperature, ambientTemperature) {
        console.log('object temperature: %d °C', objectTemperature);
        payload.objectTemperature = objectTemperature;
        console.log('ambient temperature: %d °C', ambientTemperature);
        payload.ambientTemperature = ambientTemperature;
        callback();
      });
    },
    function(callback) {
      console.log('readLuxometer');
      st.readLuxometer(function(error, lux) {
        console.log('lux: %d', lux);
        payload.light = lux;
        callback();
      });
    },
    function(callback) {
      payload.time = Date.now();
      console.log('sending: ' + JSON.stringify(payload));
      deviceClient.publish('status','json', JSON.stringify(payload));
      callback();
    },
    function(callback) {
      callback();
    }
  ]);
}
