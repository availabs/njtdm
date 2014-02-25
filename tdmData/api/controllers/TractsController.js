/**
 * TractsController
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
    
  
stateTracts: function(req,res,$http){
	var sql = 'select ST_AsGeoJSON(the_geom) as geo,geoid from tl_2013_'+req.param('stateFIPS')+'_tract';
	var routesCollection = {};
	routesCollection.type = "FeatureCollection";
	routesCollection.features = [];
	
	Tracts.query(sql,{},function(err,data){
		if (err) {
			res.send('{status:"error",message:"'+err+'"}',500);
			return console.log(err);
		}
		data.rows.forEach(function(route){
			var routeFeature = {};
			routeFeature.type="Feature";
			routeFeature.geometry = JSON.parse(route.geo);
			routeFeature.properties = {};
			routeFeature.properties.geoid = route.geoid;
			routesCollection.features.push(routeFeature);
		});
		//var topology = topojson.topology({tracts: routesCollection},{"property-transform":preserveProperties});
		res.send(JSON.stringify(routesCollection));
		//res.send(JSON.stringify(routesCollection));
	});
},
acs : function(req,res){
	if (!req.param('tracts') instanceof Array) {
		res.send('Must post Array of 11 digit fips codes to tracts');
	}
	var fips_in = "(";
	req.param('tracts').forEach(function(tract){
		
		fips_in += "'"+tract+"',";
	});
	fips_in = fips_in.slice(0, -1)+")";
	var sql = 'select * from tl_2011_34_tract_acs where geoid in '+fips_in;

	Tracts.query(sql,{},function(err,data){
		if (err) {
			res.send('{status:"error",message:"'+err+'"}',500);
			return console.log(err);
		}
		res.send(data.rows);
	});
	
},
surveyTrips : function(req,res){
	console.log("Survey");
	if (!req.param('tracts') instanceof Array) {
		res.send('Must post Array of 11 digit fips codes to tracts');
	}
	output = [];
	var fips_in = "(";
	req.param('tracts').forEach(function(tract){
		fips_in += "'"+tract+"',";
	});
	fips_in = fips_in.slice(0, -1)+")";
	var trip_table = [];
	

	var sql = "select O_MAT_LAT as o_lat, b.militarystarttime, b.weight, O_MAT_LONG as o_lng,D_MAT_LAT as d_lat, D_MAT_LONG as d_lng,o_geoid10,d_geoid10 from survey_geo as a join survey_attributes as b on a.id = b.id where MILITARYSTARTTIME BETWEEN '1970-01-01 05:30:00'::timestamp AND '1970-01-01 10:00:00'::timestamp AND o_geoid10 in "+fips_in+" and d_geoid10 in "+fips_in;
	Gtfs.query(sql,{},function(err,trips_data){
	if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		
		var id = 0;
		trips_data.rows.forEach(function(tract){
			for(var i = 0; i < tract.weight;i++){
				var trip = {};
				trip.id = id;
				id += 1;
				trip.from_geoid = tract.o_geoid10;
				trip.to_geoid = tract.d_geoid10;
				trip.from_coords = [tract.o_lat*1+(random(0,20)/10000),tract.o_lng*1+(random(0,20)/10000)];
				trip.to_coords = [tract.d_lat*1+(random(0,20)/10000),tract.d_lng*1+(random(0,20)/10000)];
				d = new Date(tract.militarystarttime);
				trip.time = d.getHours()+":"+d.getMinutes()+"am";
				trip.source ="AC Survey";
				trip_table.push(trip);
			}
		});
		res.send(trip_table);
	});
},
lehdTrips : function(req,res){
	var version = "0.0.1"
	console.log("LEHD");
	if (!req.param('tracts') instanceof Array) {
		res.send('Must post Array of 11 digit fips codes to tracts');
	}

	output = [];
	var fips_in = "(";
	req.param('tracts').forEach(function(tract){
		fips_in += "'"+tract+"',";
	});
	
	var origin_points = {};
	var destination_points = {};
	var trip_table = [];
	fips_in = fips_in.slice(0, -1)+")";
	var sql="SELECT h_geocode as home_tract, w_geocode as work_tract, CAST(s000) as bus_total from nj_od_j00_ct where CAST(s000/20 as integer) > 1 and (h_geocode in "+fips_in+" or w_geocode in "+fips_in+")";
	Gtfs.query(sql,{},function(err,tracts_data){
		if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		var sql = "select O_MAT_LAT as o_lat, O_MAT_LONG as o_lng,D_MAT_LAT as d_lat, D_MAT_LONG as d_lng,o_geoid10,d_geoid10 from survey_geo where o_geoid10 in "+fips_in+" and d_geoid10 in "+fips_in+" and not O_MAT_LAT = 0 and not O_MAT_LONG = 0 and not D_MAT_LAT= 0 and not D_MAT_LONG = 0";
		Gtfs.query(sql,{},function(err,points_data){
		
		if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
			points_data.rows.forEach(function(trip){
				
				if(trip.o_geoid10 in origin_points){
					origin_points[trip.o_geoid10].push([trip.o_lat*1,trip.o_lng*1]);
				}else{
					
					origin_points[trip.o_geoid10] = [];
					origin_points[trip.o_geoid10].push([trip.o_lat*1,trip.o_lng*1]);
				}
				if(trip.d_geoid10 in destination_points){
					destination_points[trip.d_geoid10].push([trip.d_lat*1,trip.d_lng*1]);
				}else{
					destination_points[trip.d_geoid10] = [];
					destination_points[trip.d_geoid10].push([trip.d_lat*1,trip.d_lng*1]);
				}
				
			});
			var id = 0;
			tracts_data.rows.forEach(function(tract){
				var percent_trips = 0.05;
				if(typeof req.param('buspercent')[tract.home_tract] != 'undefined'){
					percent_trips = req.param('buspercent')[tract.home_tract];
				}
				num_trips = Math.round(tract.bus_total*percent_trips);
				for(var i = 0; i < tract.bus_total;i++){
					var trip = {};
					trip.id = id;
					id += 1;
					trip.from_geoid = tract.home_tract;
					trip.to_geoid = tract.work_tract;
					trip.from_coords = [];
					trip.to_coords = [];
					if(tract.home_tract in origin_points && tract.work_tract in destination_points){
						trip.from_coords = origin_points[tract.home_tract][random(0,origin_points[tract.home_tract].length-1)];
						trip.to_coords = destination_points[tract.work_tract][random(0,destination_points[tract.work_tract].length-1)];
						trip.time = random(6,9)+":"+random(0,59)+'am';
						trip.source ="LEHD"+version;
						trip_table.push(trip);
					}
				}
			});
			res.send(trip_table);
		});
	});
},
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TractsController)
   */
  _config: {}

  
};


var preserveProperties = function(properties, key, value) {
	properties[key] = value;
	return true;
};

function random(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}