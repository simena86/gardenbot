


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

exports.updateDatabase = updateDatabase;
exports.sendDBData = sendDBData;
