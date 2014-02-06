/**
 * GtfsController
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
var topojson = require("topojson");
module.exports = {
    
  routes: function(req,res){

	if (!req.param('routes') instanceof Array) {
		res.send('Must post Array of 11 digit fips codes to tracts');
	}
	var routes_in = "(";
	req.param('routes').forEach(function(tract){
		routes_in += "'"+tract+"',";
	});
	routes_in = routes_in.slice(0, -1)+")";
	var routesCollection = {};
	routesCollection.type = "FeatureCollection";
	routesCollection.features = [];
	var sql = 'select ST_AsGeoJSON(geom) as route_shape,route_id,route_short_name,route_long_name,route_color from "njtransit_bus_07-12-201.zip".routes where route_short_name in '+routes_in;
	Gtfs.query(sql,{},function(err,data){
		if (err) {
       res.send('{status:"error",message:"'+err+'"}',500);
       return console.log(err);
      }
      data.rows.forEach(function(route){
			var routeFeature = {};
			routeFeature.type="Feature";
			routeFeature.geometry = JSON.parse(route.route_shape);
			routeFeature.properties = {};
			routeFeature.properties.route_id = route.route_id;
			routeFeature.properties.route_short_name = route.route_short_name;
			routeFeature.properties.route_long_name = route.route_long_name;
			routeFeature.properties.route_color = route.route_color;
			routesCollection.features.push(routeFeature);
		});

		var topology = topojson.topology({routes: routesCollection},{"property-transform":preserveProperties});
		var output = {};
		output.routes = topology;
		res.send(output);
			//JSON.stringify()
	});

	},
	stops: function(req,res){

		var stopsCollection = {};
		stopsCollection.type = "FeatureCollection";
		stopsCollection.features = [];
		var sql = 'select ST_AsGeoJSON(geom) as stop_shape,stop_name,stop_id,stop_code from "njtransit_bus_07-12-201.zip".stops';
		Gtfs.query(sql,{},function(err,data){
			if (err) {
				res.send('{status:"error",message:"'+err+'"}',500);
				return console.log(err);
			}
			data.rows.forEach(function(stop){
				var stopFeature = {};
				stopFeature.type="Feature";
				stopFeature.geometry = JSON.parse(stop.stop_shape);
				stopFeature.properties = {};
				stopFeature.properties.stop_id = stop.stop_id;
				stopFeature.properties.stop_code = stop.stop_code;
				stopFeature.properties.stop_name= stop.stop_name;
				
				stopsCollection.features.push(stopFeature);
			});
			
			var topology = topojson.topology({stops: stopsCollection},{"property-transform":preserveProperties});
			res.json(topology);
		});

	},


  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to GtfsController)
   */
  _config: {}

  
};

var preserveProperties = function(properties, key, value) {
	properties[key] = value;
	return true;
};