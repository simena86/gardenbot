
function onLogin(){
	console.log('started server on port 3000');
}

// express
var express = require('express');
var path = require('path');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', express.static(__dirname + '/public'));


// start server
var server = app.listen(3000, onLogin());
var io = require('socket.io').listen(server);

// on socket.io connection
io.sockets.on('connection', function (socket) {
	socket.on('cmd1', function (data) {
		handleCmd1(data);
	});
	socket.on('cmd2', function (data) {
		handleCmd2(data);
	});
});

// route http get
app.get('/mongo_data.json',function(request,response){
	console.log('get data');
	sendDBData(response);
});

// onoff
var GPIO = require('onoff').Gpio;
pump = new GPIO(21, 'out');
pump.writeSync(1);

function handleCmd1(data){
	console.log('handling cmd1 with msg:');
	console.log(data);
	if( data == 'on'){
		console.log('is on');		
		pump.writeSync(0);
	}else if(data == 'off'){
		console.log('is off');		
		pump.writeSync(1);
	}
}

function handleCmd2(data){
	console.log('handling cmd2 with msg:');
	console.log(data);
}

// update sensor reading at set intervals 
var counter1 = 0;
var interval = 3 * 1000;
setInterval( onSensorReading, interval);

function getNewSensorData(){
	readHumidity();
  	var r = SENSOR_READING.humidity;
  	var aDate1 = new Date();
  	var newDataObj = {
		sensors : {
			humidity : {
				'date': new Date(), 'value': r, 'data': null
			}
		}
	}
	return newDataObj;
}

// send new data as JSON object
// data is sent over socket.io
function sendData2Client(newData){
	io.emit('sensor_input',newData);
}

function onSensorReading(){
	var newData = getNewSensorData();
	sendData2Client( newData );
	updateDatabase( newData );
}

function updateDatabase(newData){
	var humData;
	if (humidityCollection != null){
		humData = newData.sensors.humidity
		humidityCollection.update( {type: 'sensorData'}, {$push: {'humidity' : humData }});
	}
}

// send entire db data as a response to a get
function sendDBData( response ){
	var stream = humidityCollection.find({type:'sensorData'}).stream();
	humidityCollection.find({type:'sensorData'}).toArray(function(err, items) {
		response.send( JSON.stringify(  items ) );
	});
}

var SENSOR_READING = {
	humidity : 0,
	light : 0
}

// ADC
var ads1x15 = require('node-ads1x15');
var chip = 1; //0 for ads1015, 1 for ads1115
var adc = new ads1x15(chip); //optionally i2c address as (chip, address) but only if addr pin NOT tied to ground...
var channel = 0; //channel 0, 1, 2, or 3...
var samplesPerSecond = 64; // see index.js for allowed values for your chip
var progGainAmp = 4096; // see index.js for allowed values for your chip

function readHumidity(){
    if(!adc.busy){
        adc.readADCSingleEnded(channel,progGainAmp, samplesPerSecond,  function(err,data) {
            if(err){
				console.log('throw err');
               throw err;
            }
            SENSOR_READING.humidity = data;
        });
    }
}

var db_url = "mongodb://simen2:raspberry@ds029640.mongolab.com:29640/home_automation";
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var myDB = null;
var humidityCollection = null;

MongoClient.connect(db_url, function (err, db) {
  	if (err) {
    	console.log('Unable to connect to the mongoDB server. Error:', err);
	} else {
		console.log('Connection established to', db_url);
		myDB = db;
		humidityCollection = db.collection('humidity');
		humidityCollection.findOne({ type: 'sensorData' }, function(err, doc) { 
			if (doc) { 
				console.log("sensor data exists"); 
			} else { 
				console.log("sensorData doesn't exist"); 
				humidityCollection.insert({type : 'sensorData', humidity: []});	
			}
  		});
  	}
});

