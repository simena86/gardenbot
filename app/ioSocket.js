/*
 * handle async communication over socket
 * to browser
 */

module.exports = Socket;

// private:


// public:

function Socket(server){
	this.io = require('socket.io').listen(server);
	this.server = server;	
}


Socket.prototype.initReceivedSockets = function(rpiIO){
	this.io.sockets.on('connection', function (socket) {
		socket.on('cmd1', function (data) {
			console.log('cmd1');
			handleP(data);
		});
	});
	console.log('init ioSocket');
}


Socket.prototype.sendData2Client = function (newData){
	this.io.emit('sensor_input',newData);
}












