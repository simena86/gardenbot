


var SENSOR_READING = {
	humidity : 0,
	light : 0
}

// ADC - analog to digital converter
var ads1x15 = require('node-ads1x15');
var chip = 1; 
var adc = new ads1x15(chip);
var channel = 0; 
var samplesPerSecond = 64; 
var progGainAmp = 4096; 

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



var GPIO = require('onoff').Gpio;
pump = new GPIO(21, 'out');
pump.writeSync(1);

function handleTogglePumpCmd(data){
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

function onSensorReading(socket, database){
	var newData = getNewSensorData();
	socket.sendData2Client( newData );
	database.updateDatabase( newData );
}

exports.onSensorReading = onSensorReading;
exports.handleTogglePumpCmd = handleTogglePumpCmd;

