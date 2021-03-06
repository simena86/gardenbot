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

var socket = io();

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

var CHARTS_DATA = {
	humidity: null	
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
			'vAxis': { 'title': 'humidity [%]' },
			'hAxis': {
					'direction': CHART_COMMON.direction,
					'format': 'dd/MM/yy HH:mm'
			},
			// Use the same chart area width as the control for axis alignment.
			title: "Soil Humidity",
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

// parse humidity data into data array for google charts
function parseHumidityData( humidityArray ){
	var arrayData = humidityArray;
	var dataTable = new google.visualization.DataTable();
	dataTable.addColumn('datetime', 'Time');
	dataTable.addColumn('number', 'Humidity');
	dataTable.addColumn({ type: 'string', role: 'annotation' });
	for (var i = 0; i < arrayData.length; i++) {
		date = new Date(arrayData[i].date);
		value = arrayData[i].value;
		dataTable.addRow([date, value, null]);
	}
	return dataTable;
}

function drawPower() {
	console.log('draw power');
	CHART1_PROPS.dashboard.draw( SENSOR_DATA.parsedData1);
}

// draw humidity data to charts
// use global CHARTS_DATA as data for drawing
function drawHumidity() {
	console.log('draw temp');
	CHART2_PROPS.dashboard.draw( CHARTS_DATA.humidity );
}

function getDBFromServer(){
	$.get("/mongo_data.json", function(data, status){
		if (data == null){
			initCharts(null);
		}else{
			var sensorDataObj = JSON.parse( data )[0];
			initCharts(sensorDataObj);
		}
   });
}

// set state of controller to view
// the 3 past days if possible
function setControllerState(humidityArray){
	var startDate = new Date(humidityArray[0].date);
	var l = humidityArray.length;
	var newStartDate = new Date(humidityArray[l-1].date);
	var endDate = new Date(humidityArray[l-1].date);
	var hours = Math.abs(endDate - startDate) / 36e5;
	if ( hours > 1 ){
		newStartDate = new Date(newStartDate.setHours( endDate.getHours() - 1 ) ) ;
		tempState = CHART2_PROPS.control.getState() ;
		tempState.range.start = newStartDate;
		CHART2_PROPS.control.setState( tempState );
	}

}

function initCharts(sensorDataObj){
  	CHART2_PROPS.dashboard.bind( CHART2_PROPS.control, CHART2_PROPS.chart );
	if ( sensorDataObj != null){
		CHARTS_DATA.humidity = parseHumidityData( sensorDataObj.humidity );
		//SENSOR_DATA.parsedData2 = parseData2( SENSOR_DATA.raw2 );
		//CHART1_PROPS.dashboard.bind( CHART1_PROPS.control, CHART1_PROPS.chart );
		setControllerState(sensorDataObj.humidity);
		//drawPower();
		drawHumidity();
	}else{
		console.log('null in init charts');	
	}
	google.visualization.events.addListener(CHART2_PROPS.control, 'statechange', function () {
		var temp = CHART2_PROPS.control.getState();			
		//CHART1_PROPS.control.setState(temp);
		//drawPower();
	});
}

// update charts based on new data
// sent over io socket
function updateChart(newData){
	if ( CHARTS_DATA.humidity){
		var data = newData.sensors;
		var tempState = CHART2_PROPS.control.getState() ;
		var prevStart = new Date(tempState.range.start);
		var date2 = new Date(data.humidity.date);
		CHARTS_DATA.humidity.addRow( [date2, data.humidity.value, data.humidity.data ] );
		tempState.range.end = date2;
		tempState.range.start = prevStart;
		CHART2_PROPS.control.setState( tempState );
		fadeInOutLabel();
		drawHumidity();
	} else {
		console.log('humidity charts data not ready for writing');
	}
}

// fade in and out label indicating 
// new sensor data
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



