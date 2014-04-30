/**
 * TriptableController
 *
 * @module  :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var sh = require('execSync');

module.exports = {
    
	runModel: function(req,res){
		var result = sh.exec('pwd');
		var command = 'php5 -f cliRunModel.php '+req.param('id')+' > '+result.stdout.slice(0,-1)+'/model.log &';
		var running = sh.run(command);
		res.send('done');
	},
	runStatus: function(req,res){
		Triptable.find(req.param('id')).exec(function (err, trip) {
			if (err) {res.send('{status:"error",message:"'+err+'"}',500);return console.log(err);}
			if(trip[0].model_finished == 1){
				res.send({"status":"finished"});
			}else{
				var sql = 'select count(*) as num from model_trips where run_id = '+req.param('id');
				Gtfs.query(sql,{},function(err,data){
					res.send({"status":"running","runs_processed":data.rows[0].num*1,"total":trip[0].trips.length});
				});
			}
		});
	},
	models: function(req,res){
		var where = '';
		if(typeof req.param('marketarea') != 'undefined'){
			where = ' and scenario."marketArea" = '+req.param('marketarea');
		}
		var sql = 'SELECT scenario.name,triptable.id,scenario."marketArea" FROM scenario join triptable on scenario.trip_table_id = triptable.id where triptable.model_finished = 1' +where;
		Gtfs.query(sql,{},function(err,data){
			res.send(data.rows);
		});

	},
	modelData: function(req,res){
		var sql = "SELECT scenario.name,scenario.routes,triptable.id FROM scenario join triptable on scenario.trip_table_id = triptable.id where triptable.id = "+req.param('id');
		Gtfs.query(sql,{},function(err,data){
			if (err) {res.send('{sql:"'+sql+'",status:"error",message:"'+err+'"}',500);return console.log(err);}
			if(data.rows.length <= 0){
				res.send({"status":"Model not computer for this trip table"});
			}else{
				var routes = data.rows[0].routes.replace('[','(').replace(']',')').replace(/\"/g, "'");
				sql ="SELECT a.trip_id,a.duration,a.distance,a.route,a.on_stop_code,a.gtfs_trip_id,a.off_stop_code,b.start_time,b.waiting_time,b.walk_distance,b.walking_time,	c.arrival_time,	d.arrival_time as trip_start_time,f.fare_zone as on_fare_zone,	g.fare_zone as off_fare_zone from model_legs a join model_trips b ON a.trip_id = b.id join \"njtransit_bus_07-12-2013\".stop_times c ON a.on_stop_id = c.stop_id and a.gtfs_trip_id = c.trip_id join fare_zones f on f.stop_num = a.on_stop_code and f.line = a.route	join fare_zones g on g.stop_num = a.off_stop_code and g.line = a.route join \"njtransit_bus_07-12-2013\".stop_times d ON d.stop_sequence = 1 and a.gtfs_trip_id = d.trip_id where a.run_id = "+req.param('id')+" and mode = 'BUS'and g.fare_zone like 'P%'and (d.arrival_time like '06%' or  d.arrival_time like '07%' or d.arrival_time like '08%' or d.arrival_time like '09%') and a.route in "+routes;
				Gtfs.query(sql,{},function(err,output){
					if (err) {res.send('{sql:"'+sql+'",status:"error",message:"'+err+'"}',500);return console.log(err);}
					res.send(output.rows);
				});
				
			}
		});
	
	},
	/**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TriptableController)
   */
  _config: {}
  
};
