/*
 * server script hosting html page
 * and controlling and monitor raspberry pi
 * by simen Andresen
 * 
 */

// setup server
var express = require('express');
var path = require('path');
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', express.static(__dirname + '/public'));
var server = app.listen(3000, function (){
		console.log('started server on port 3000');
	}
);

// socket for real time communication 
// with client
var Socket = require('./app/ioSocket');
socket = new Socket(server);

// database for logging
var database = require('./app/database');

// route http requests
var router = require('./app/router')(app, database);

// IO on raspberry pi
var rpiIO = require('./app/rpiIO')
socket.initReceivedSockets(rpiIO);
var interval = 3000;
setInterval( runEachInterval , interval);

function runEachInterval(){
	rpiIO.onSensorReading(socket, database);
}







