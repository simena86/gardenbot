/*
 * route http responses
 */

module.exports = function(app, database){

	// route http get mongo_data
	app.get('/mongo_data.json',function(request,response){
		console.log('get data');
		database.sendDBData(response);
	});


}
