/**
 * TriptableController
 *
 * @module      :: Controller
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
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TriptableController)
   */
  _config: {}
  
};
