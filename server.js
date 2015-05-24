
function onLogin(){
	console.log('started server on port 3000');
}

// express
var express = require('express');
var path = require('path');
var app = express();

app.get('/mongo_data.json',function(request,response){
	console.log('get data');
	response.send( JSON.stringify( SENSOR_DATA) );
});

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

function handleCmd1(data){
	console.log('handling cmd1 with msg:');
	console.log(data);
}

function handleCmd2(data){
	console.log('handling cmd2 with msg:');
	console.log(data);
}

// update every 4 minutes
var counter1 = 0;
var interval = 3 * 1000;
var dayCntr = 0;
setInterval( onSensorReading, interval);

function getNewSensorData(){
	var r = Math.random();
	var r1 = Math.random();
	var msg = {message: r};
	dayCntr ++;
  var aDate1 = new Date();
  var aDate2 = new Date();
	counter1++;
	var newDataObj = {
		sensors : {
			power : [aDate1, r, null],
			temp : [aDate2, r+3, null]		
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

}

var SENSOR_DATA = {
	raw1 : [[2015, 04, 17, 0, 00, 34, 01], 
				 [2015, 05, 17, 0, 01, 35, 02], 
				 [2015, 05, 17, 0, 02, 35, 02], 
				 [2015, 05, 17, 0, 03, 35, 02], 
				 [2015, 05, 18, 0, 04, 35, 09]] ,

	raw2 : [[2015, 04, 17, 0, 09, 34, 05], 
				 [2015, 05, 17, 0, 05, 35, 06], 
				 [2015, 05, 17, 0, 06, 35, 06], 
				 [2015, 05, 17, 0, 07, 35, 06], 
				 [2015, 05, 18, 0, 06, 35, 02]],
}


var ads1x15 = require('node-ads1x15');
var chip = 1; //0 for ads1015, 1 for ads1115
var adc = new ads1x15(chip); //optionally i2c address as (chip, address) but only if addr pin NOT tied to ground...
var channel = 0; //channel 0, 1, 2, or 3...
var samplesPerSecond = 64; // see index.js for allowed values for your chip
var progGainAmp = 4096; // see index.js for allowed values for your chip

//somewhere to store our reading
var reading = 0;
function readADC(){
    if(!adc.busy){
        adc.readADCSingleEnded(channel,progGainAmp, samplesPerSecond,  function(err,data) {
            if(err){
                //logging / troubleshooting code goes here...
               throw err;
            }
            // if you made it here, then the data object contains your reading!
            reading = data;
            console.log(data);
            // any other data processing code goes here...
        }
        );
    }
}


setInterval( readADC, 5000);
readADC();



/*
//var db_url = "mongodb://simen2:raspberry@ds029640.mongolab.com:29640/home_automation";
var db_url = "mongodb://simen2:raspberry@ds029640.mongolab.com:29640/home_automation";
var collections = ["test_collection"]
console.log('done 0');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

//var db = require("mongojs").connect(databaseUrl, collections);

MongoClient.connect(db_url, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    //HURRAY!! We are connected. :)
    console.log('Connection established to', url);

    // Get the documents collection
    var collection = db.collection('test_collection');

    //Create some users
    var user1 = {name: 'modulus admin', age: 42, roles: ['admin', 'moderator', 'user']};
    var user2 = {name: 'modulus user', age: 22, roles: ['user']};
    var user3 = {name: 'modulus super admin', age: 92, roles: ['super-admin', 'admin', 'moderator', 'user']};

    // Insert some users
    collection.insert([user1, user2, user3], function (err, result) {
      if (err) {
        console.log(err);
      } else {
        console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
      }
      //Close connection
      db.close();
    });
  }
});

*/
