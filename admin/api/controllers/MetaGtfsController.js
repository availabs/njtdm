/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	getRoutes:function(req,res){
		MetaGtfs.findOne(req.param('id')).exec(function(err,currentGTFS){
			 var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+currentGTFS.tableName+'.routes';
		     MetaGtfs.query(sql,{},function(err,data){
		      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		      output = data.rows;
		      return res.json(output);
		    });
		})
	}
};

