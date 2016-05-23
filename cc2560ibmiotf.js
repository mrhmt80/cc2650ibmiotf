var Client = require('ibmiotf');
var sensorTag = require('sensortag');
var async = require('async');

var config = {
  'org': 'a5vgz2',
  'id': 'k34CC2650',
  'type': 'CC2650',
  'auth-method': 'token',
  'auth-token': '1221080932'
};

var payload = {
  'ambientTemperature': null,
  'humidity': null,
  'light': null,
  'objectTemperature': null,
  'pressure': null,
  'temperature': null
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
      console.log('sending: ' + JSON.stringify(payload));
      deviceClient.publish('status','json', JSON.stringify(payload));
    },
    function(callback) {
      callback();
    }
  ]);
}
