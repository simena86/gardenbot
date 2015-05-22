/*
 * javascript for control and monitoring of 
 * watering of plants.
 */

var GardenStates = {
	isAuth : false,
	password : null,
	username : null
};


function donePassword() { 
	document.getElementById("my_popup").style.display = "none";
	GardenStates.username = document.getElementById("username").value;
	GardenStates.password = document.getElementById("pass").value;

}

function showPasswordPopup() {
	 document.getElementById("my_popup").style.display = "block";
}

// check cookie, or send authenticate to 
// server and receive response
function authenticate(){
	var cookie = document.cookie;

	showPasswordPopup();
	
}

// toggle event 1
function onToggle1() {
    console.log('ontoggle');
    var bol = $(this).prop('checked');
		var command = '';
    if (bol) {
				authenticate();
        $('#switch1-text').html('Watering On');
				command = 'on';
    } else {
        $('#switch1-text').html('Watering Off ');
				command = 'off';
    }
	  try {
			socket.emit('cmd1', command);	
		}catch(err){
			alert('Error io not connected, msg: ' + err.message );	
		}
}

// toggle event 2
function onToggle2() {
    var bol = $(this).prop('checked');
		var command = '';
    if (bol) {
				authenticate();
        $('#switch2-text').html('Autowatering Enabled');
				command = 'on';
    } else {
        $('#switch2-text').html('Autowatering Disabled');
				command = 'off';
    } 
		try {
			socket.emit('cmd2', command);	
		}catch(err){
			alert('Error io not connected, msg: ' + err.message );	
		}
}

var socket = io('http://localhost:3000');

function onReady() {
	$('#toggle-event1').change(onToggle1);
	$('#toggle-event2').change(onToggle2);

	$('#new-data').fadeTo(50, 0) ;
	google.setOnLoadCallback( getDBFromServer() );
	socket.on('sensor_input', function(msg){
			updateChart(msg);
	}); 
}

$('#home').ready(onReady);

//  ---------------- charts ----------------  //

var SENSOR_DATA = {
	raw1 : null,
	raw2 : null,
	parsedData1 : null,
	parsedData2 : null
}

function initSensorData(string){
	data = JSON.parse( string );
	SENSOR_DATA.raw1 = data.raw1;
	SENSOR_DATA.raw2 = data.raw2;

}

var CHART_COMMON = {
	dayCntr : 1,
	tempState : null,
	direction : 1
}

var CHART1_PROPS = new function() {
	this.options = {
		'chartType': 'LineChart',
		'containerId': 'powerChart',
		'options': {
			'animation' : {
				'duration': 500,
				'easing': 'in'					
			},
				colors: ['green'],
				title: "Energy Consumption",
				'legend': { 'position': 'none' },
				'vAxis': { 'title': 'power [W]' },
				'hAxis': {
						'direction': CHART_COMMON.direction
						, 'format': 'dd/MM/yy HH:mm'
				}
		},
		view: { 'columns': [0, 1, 2] }
	};
	this.controlOptions = {
			'controlType': 'ChartRangeFilter',
			'containerId': 'powerControl',
			'options': {
					'filterColumnIndex': 0,
					'ui': {
							'chartType': 'LineChart',
							'chartOptions': {
									'hAxis': {
											'baselineColor': 'none',
											'direction': CHART_COMMON.direction
									}
							},
							'chartView': {
									'columns': [0, 1]
							},
							// 1 day in milliseconds
							'minRangeSize': 8640
					}
			},
		};
	this.dashboard = new google.visualization.Dashboard( document.getElementById('dashboard') );
	this.chart =  new google.visualization.ChartWrapper( this.options );
	this.control = new google.visualization.ControlWrapper( this.controlOptions );
}

CHART2_PROPS = new function() {
	this.options = {
			'chartType': 'LineChart',
			'containerId': 'tempChart',
			'options': {
				'animation' : {
					'duration': 500,
					'easing': 'in'					
				},
				'vAxis': { 'title': 'temp [C]' },
				'hAxis': {
						'direction': CHART_COMMON.direction,
						'format': 'dd/MM/yy HH:mm'
				},
				// Use the same chart area width as the control for axis alignment.
				title: "Temperature Measurement, Trondheim",
				'legend': { 'position': 'none' }
			},
			// Convert the first column from 'date' to 'string'.
			view: { 'columns': [0, 1, 2] }
	};
	this.controlOptions = {
			'controlType': 'ChartRangeFilter',
			'containerId': 'tempControl',
			'options': {
					// Filter by the date axis.
					'filterColumnIndex': 0,
					'ui': {
							'chartType': 'LineChart',
							'chartOptions': {
									'hAxis': {
											'baselineColor': 'none',
											'direction': CHART_COMMON.direction,
											'format': 'dd/MM/yy HH:mm'
									}
							},
							'chartView': {
									'columns': [0, 1]
							},
							'minRangeSize': 86400
					}
			},
			'state': {
					'range': {
							'end': new Date()
					}
			}
	};
  this.chart = new google.visualization.ChartWrapper(this.options);
	this.control = new google.visualization.ControlWrapper(this.controlOptions);
	this.dashboard = new google.visualization.Dashboard( document.getElementById('dashboard') );
}

// power data
function parseData1( rawData ){
	var arrayData = rawData;
	var power_data = new google.visualization.DataTable();
	power_data.addColumn('datetime', 'Time');
	power_data.addColumn('number', 'Power [W]');
	power_data.addColumn({ type: 'string', role: 'annotation' });
	var temp = 1;
	var power;
	var nowIsSet = false;
	var now = new Date();
	var daysAgo = Math.floor((arrayData.length / (6 * 24)));
	for (var i = 0; i < arrayData.length; i++) {
		temp++
		var row = arrayData[i];
		power = row[6]
		var aDate = new Date(row[0], row[1] - 1, row[2], row[3], row[4]);
		if (isNowDate(aDate, now, true) == true && nowIsSet == false) {
			power_data.addRow([aDate, power, 'Now']);
			nowIsSet = true;
		} else if (row[3] == 0 && row[4] == 0) {
			if (daysAgo == 0) {
				power_data.addRow([aDate, power, 'Today']);
			} else {
				power_data.addRow([aDate, power, daysAgo.toString() + ' Days ago']);
			}
			daysAgo--;
		} else {
			power_data.addRow([aDate, power, null]);
		}
	}
	return power_data;
}

function parseData2(rawData){
    var d = new Date();
    var year = d.getFullYear();
    var day = d.getDate();
    var month = d.getMonth();
    var hour = d.getHours();
    var min = d.getMinutes();
    var endDate = new Date(year, day, month, hour, min);
    var startDay = day - 1;
    var startDate = new Date(year, startDay, month, hour, min);
    var arrayData = rawData;

    var temp_data = new google.visualization.DataTable();
    temp_data.addColumn('datetime', 'Time');
    temp_data.addColumn('number', 'Temperature [C]')
    temp_data.addColumn({ type: 'string', role: 'annotation' });
    var daysAgo = Math.floor((arrayData.length / 24) - 1);
    var temp = 1
    var now = new Date();
    for (var i = 0; i < arrayData.length; i++) {
        temp++
        var row = arrayData[i];
        var aDate = new Date(row[0], row[1] - 1, row[2], row[3], row[4]);
        if (isNowDate(aDate, now, false) == true) {
            temp_data.addRow([aDate, row[6], 'Now']);
        } else if (row[3] == 0) {
            if (daysAgo == 0) {
                temp_data.addRow([aDate, row[6], 'Today']);
            } else {
                temp_data.addRow([aDate, row[6], daysAgo.toString() + ' Days ago']);
            }
            daysAgo--;
        } else {
            temp_data.addRow([aDate, row[6], null]);
        }
    }
		return temp_data;
}

// check if the datetime data is the current datetime
function isNowDate(aDate, d, useMinutePrec) {
    var year = d.getFullYear();
    var day = d.getDate();
    var month = d.getMonth();
    var hour = d.getHours();
    var min = d.getMinutes();
    if ((year == aDate.getFullYear()) && (month == aDate.getMonth()) && 
				(day == aDate.getDate()) && (hour == aDate.getHours())) {
        if (useMinutePrec == true && (aDate.getMinutes() < (min - 10) || (aDate.getMinutes()) > (min + 10))) {
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}

function drawPower() {
	console.log('draw power');
	CHART1_PROPS.dashboard.draw( SENSOR_DATA.parsedData1);
}

// temp data
function drawTemp() {
	console.log('draw temp');
	CHART2_PROPS.dashboard.draw( SENSOR_DATA.parsedData2 );
}

function getDBFromServer(){
	$.get("/mongo_data.json", function(data, status){
		console.log(data);
		initSensorData(data);
		initCharts();
   });
}

function initCharts(){
	SENSOR_DATA.parsedData1 = parseData1( SENSOR_DATA.raw1 );
	SENSOR_DATA.parsedData2 = parseData2( SENSOR_DATA.raw2 );
	CHART1_PROPS.dashboard.bind( CHART1_PROPS.control, CHART1_PROPS.chart );
  CHART2_PROPS.dashboard.bind( CHART2_PROPS.control, CHART2_PROPS.chart );
	drawPower();
	drawTemp();
	google.visualization.events.addListener(CHART2_PROPS.control, 'statechange', function () {
			var temp = CHART2_PROPS.control.getState();			
			CHART1_PROPS.control.setState(temp);
			drawPower();
	});
}

/* 
 * temporary function. will be removed
 * newData must be a JSON string
 */
function updateChart(newData){
	var data = newData.sensors;
	var tempState = CHART2_PROPS.control.getState() ;
	var prevStart = new Date(tempState.range.start);
	var date1 = new Date(data.power[0]);
	var date2 = new Date(data.temp[0]);
	SENSOR_DATA.parsedData1.addRow( [ date1, data.power[1], data.power[2] ] );
	SENSOR_DATA.parsedData2.addRow( [date2, data.temp[1], data.temp[2] ] );
	tempState.range.end = date2;
	tempState.range.start = prevStart;
	CHART1_PROPS.control.setState( tempState );
	CHART2_PROPS.control.setState( tempState );
	fadeInOutLabel();
	drawPower();
	drawTemp();
}

function fadeInOutLabel(){
	$('#new-data').fadeTo(500, 1);	
	setTimeout( function(){ $('#new-data').fadeTo(500, 0) }, 1100 );
}


/* setting function to run in intervals
var interval = 3 * 1000;
var counter1 = 0;
function updateChartWrapper(){
	var r = Math.random();
	var r1 = Math.random();
	var msg = {message: r};
	CHART_COMMON.dayCntr++;
  var aDate1 = new Date(2015, 06, 02, counter1, 00);
  var aDate2 = new Date(2015, 06, 02, counter1+1, 00);
	counter1++;
	var newDataObj = {
		sensors : {
			power : [aDate1, r, null],
			temp : [aDate2, r+3, null]		
		}
	}
	var newDataString = JSON.stringify(newDataObj);
	updateChart(newDataString);
}

setInterval(updateChartWrapper, interval);
*/



