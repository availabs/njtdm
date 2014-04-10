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

	Triptable.query(sql,{},function(err,data){
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
	var odtype = "stops";
	if(typeof req.param('od') != 'undefined'){
		odtype =req.param('od');
	}
	output = [];
	var fips_in = "(";
	req.param('tracts').forEach(function(tract){
		fips_in += "'"+tract+"',";
	});
	fips_in = fips_in.slice(0, -1)+")";
	var trip_table = [];
	var sql = "select accessmode as access,O_MAT_LAT as o_lat,O_MAT_LONG as o_lng,ON_MAT_LAT as on_lat,ON_MAT_LONG as on_lng,OFF_MAT_LAT as off_lat,OFF_MAT_LONG as off_lng, b.militarystarttime, b.weight, D_MAT_LAT as d_lat, D_MAT_LONG as d_lng,o_geoid10,d_geoid10 from survey_geo as a join survey_attributes as b on a.id = b.id where MILITARYSTARTTIME BETWEEN '1970-01-01 05:30:00'::timestamp AND '1970-01-01 10:00:00'::timestamp AND o_geoid10 in "+fips_in+" and d_geoid10 in "+fips_in;
	console.log(sql);
	Gtfs.query(sql,{},function(err,trips_data){
	if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		getSurveyOD(fips_in,function(origin_points,destination_points){
			var id = 0;
			trips_data.rows.forEach(function(tract){
				for(var i = 0; i < tract.weight;i++){
					var trip = {};
					trip.id = id;
					id += 1;
					trip.from_geoid = tract.o_geoid10;
					trip.to_geoid = tract.d_geoid10;
					if(tract.access != 1){
						trip.from_coords = [tract.on_lat*1+(random(0,20)/10000),tract.on_lng*1+(random(0,20)/10000)];
					}else{
						trip.from_coords = [tract.o_lat*1+(random(0,20)/10000),tract.o_lng*1+(random(0,20)/10000)];
					}
					trip.to_coords = [tract.d_lat*1+(random(0,20)/10000),tract.d_lng*1+(random(0,20)/10000)];
					
					d = new Date(tract.militarystarttime);
					trip.time = d.getHours()+":"+d.getMinutes()+"am";
					trip.source ="AC Survey";
					trip_table.push(trip);
				}
			});
			res.send(trip_table);
		});
	});
},
ctppTrips : function(req,res){
	var version = "0.0.1";
	console.log("CTPP "+version);
	if (!req.param('tracts') instanceof Array) {
		res.send('Must post Array of 11 digit fips codes to LEHD Trip Table');
	}
	var odtype = "stops";
	if(typeof req.param('od') != 'undefined'){
		odtype =req.param('od');
	}
	var timeOfDay = "am";
	if(typeof req.param('timeofday') != 'undefined'){
		timeOfDay = req.param('timeofday');
	}
	console.log(odtype);
	output = [];
	var fips_in = "(";
	req.param('tracts').forEach(function(tract){
		fips_in += "'"+tract+"',";
	});
	
	
	var trip_table = [];
	fips_in = fips_in.slice(0, -1)+")";
	var sql="SELECT from_tract as home_tract, to_tract as work_tract, est as bus_total from ctpp_a302103_tracts where (from_tract in "+fips_in+" or to_tract in "+fips_in+")";
	Gtfs.query(sql,{},function(err,tracts_data){
		if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		if(odtype == "survey"){
			getSurveyOD(fips_in,function(origin_points,destination_points){
				var id = 0;
				tracts_data.rows.forEach(function(tract){
					var percent_intime = 1;
					var timeMatrix = {};
					if(typeof req.param('buspercent') != 'undefined'){
						var vars = calculateCensus(req.param('buspercent'),tract,timeOfDay);
						percent_trips =  vars.percent_trips;
						percent_intime = vars.percent_intime;
						timeMatrix = vars.timeMatrix;
					}
					if(typeof req.param('cenData')!= 'undefined'){
						if(typeof req.param('cenData')[tract.home_tract] != 'undefined'){
							//var regessionRiders = Math.round(38.794+(req.param('cenData')[tract.home_tract].car_0*0.544)+(req.param('cenData')[tract.home_tract].arts*0.158)+(req.param('cenData')[tract.home_tract].race_white*-0.027));
							var regessionRiders = Math.round((req.param('cenData')[tract.home_tract].car_0*0.743)+(req.param('cenData')[tract.home_tract].car_1*0.141)+(req.param('cenData')[tract.home_tract].information*-0.813))
							if(req.param('buspercent')[tract.home_tract].bus_to_work > 0){
								regPercent= regessionRiders / req.param('buspercent')[tract.home_tract].bus_to_work;
							}else{
								regPercent= 1;
							}	
						}
						// if(tract.home_tract == '34009021400'){
						// console.log('what is happeniing?',regessionRiders,regPercent,req.param('cenData')[tract.home_tract].car_0,req.param('cenData')[tract.home_tract].car_1);
						// }
						num_trips =  tract.bus_total*percent_intime*Math.abs(regPercent);
					}else{
						num_trips = tract.bus_total*percent_intime;
					}
					for(var i = 0; i < num_trips;i++){
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
							trip.time =getTime(timeMatrix);
							trip.source ="CTPP"+version;
							trip_table.push(trip);
						}
					}
				});
				res.send(trip_table);
			});
		}else if(odtype == "stops"){
			getStopsOD(fips_in,function(stop_points){
				var id = 0;
				tracts_data.rows.forEach(function(tract){
					var percent_trips = 0.05;
					var percent_intime = 1;
					var timeMatrix = {};
					if(typeof req.param('buspercent') != 'undefined'){
						var vars = calculateCensus(req.param('buspercent'),tract,timeOfDay);
						percent_trips =  vars.percent_trips;
						percent_intime = vars.percent_intime;
						timeMatrix = vars.timeMatrix;
					}
					var regPercent = 1;
					if(typeof req.param('cenData')!= 'undefined'){
						if(typeof req.param('cenData')[tract.home_tract] != 'undefined'){
							var regessionRiders = Math.round(38.794+(req.param('cenData')[tract.home_tract].car_0*0.544)+(req.param('cenData')[tract.home_tract].arts*0.158)+(req.param('cenData')[tract.home_tract].race_white*-0.027));
							if(req.param('buspercent')[tract.home_tract].bus_to_work > 0){
								regPercent= regessionRiders / req.param('buspercent')[tract.home_tract].bus_to_work;
							}else{
								regPercent= regessionRiders / 1;
							}	
						}
						console.log(regessionRiders,regPercent);
						num_trips =  tract.bus_total*percent_intime*Math.abs(regPercent);
					}else{
						num_trips = tract.bus_total*percent_intime;
					}
					for(var i = 0; i < num_trips;i++){
						var trip = {};
						trip.id = id;
						id += 1;
						trip.from_geoid = tract.home_tract;
						trip.to_geoid = tract.work_tract;
						trip.from_coords = [];
						trip.to_coords = [];
						if(tract.home_tract in stop_points && tract.work_tract in stop_points){
							trip.from_coords = stop_points[tract.home_tract][random(0,stop_points[tract.home_tract].length-1)];
							trip.from_coords[0] += pointVariation();
							trip.from_coords[1] += pointVariation();
							
							trip.to_coords = stop_points[tract.work_tract][random(0,stop_points[tract.work_tract].length-1)];
							trip.to_coords[0] += pointVariation();
							trip.to_coords[1] += pointVariation();
							
							trip.time = getTime(timeMatrix);
							trip.source ="CTPP"+version;
							trip_table.push(trip);
						}
					}
				});
				res.send(trip_table);
			});

		}
	});
},
lehdTrips : function(req,res){
	var version = "0.0.3";
	console.log("LEHD");
	if (!req.param('tracts') instanceof Array) {
		res.send('Must post Array of 11 digit fips codes to LEHD Trip Table');
	}
	var odtype = "stops";
	if(typeof req.param('od') != 'undefined'){
		odtype =req.param('od');
	}
	var timeOfDay = "am";
	if(typeof req.param('timeofday') != 'undefined'){
		timeOfDay = req.param('timeofday');
	}
	
	output = [];
	var fips_in = "(";
	req.param('tracts').forEach(function(tract){
		fips_in += "'"+tract+"',";
	});
	
	
	var trip_table = [];
	fips_in = fips_in.slice(0, -1)+")";
	var sql="SELECT h_geocode as home_tract, w_geocode as work_tract, s000 as bus_total from nj_od_j00_ct where CAST(s000/5 as integer) > 1 and (h_geocode in "+fips_in+" or w_geocode in "+fips_in+")";
	Gtfs.query(sql,{},function(err,tracts_data){
		if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		if(odtype == "survey"){
			getSurveyOD(fips_in,function(origin_points,destination_points){
				var id = 0;
				tracts_data.rows.forEach(function(tract){
					var percent_trips = 0.05;
					var percent_intime = 1;
					var timeMatrix = {};
					if(typeof req.param('buspercent') != 'undefined'){
						var vars = calculateCensus(req.param('buspercent'),tract,timeOfDay);
						percent_trips =  vars.percent_trips;
						percent_intime = vars.percent_intime;
						timeMatrix = vars.timeMatrix;
					}
					num_trips = Math.round(tract.bus_total*percent_trips);
					for(var i = 0; i < num_trips;i++){
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
							trip.time = getTime(timeMatrix);
							trip.source ="LEHD"+version;
							trip_table.push(trip);
						}
					}
				});
				res.send(trip_table);
			});
		}else if(odtype == "stops"){
			getStopsOD(fips_in,function(stop_points){
				var id = 0;
				tracts_data.rows.forEach(function(tract){
					var percent_trips = 0.05;
					var percent_intime = 1;
					var timeMatrix = {};
					if(typeof req.param('buspercent') != 'undefined'){
						var vars = calculateCensus(req.param('buspercent'),tract,timeOfDay);
						percent_trips =  vars.percent_trips;
						percent_intime = vars.percent_intime;
						timeMatrix = vars.timeMatrix;
					}
					num_trips = Math.round(tract.bus_total*percent_trips*percent_intime);
					for(var i = 0; i < num_trips;i++){
						var trip = {};
						trip.id = id;
						id += 1;
						trip.from_geoid = tract.home_tract;
						trip.to_geoid = tract.work_tract;
						trip.from_coords = [];
						trip.to_coords = [];
						if(tract.home_tract in stop_points && tract.work_tract in stop_points){

							trip.from_coords = stop_points[tract.home_tract][random(0,stop_points[tract.home_tract].length-1)];
							trip.from_coords[0] += pointVariation();
							trip.from_coords[1] += pointVariation();
							
							trip.to_coords = stop_points[tract.work_tract][random(0,stop_points[tract.work_tract].length-1)];
							trip.to_coords[0] += pointVariation();
							trip.to_coords[1] += pointVariation();
							
							trip.time = getTime(timeMatrix);
							trip.source ="LEHD"+version;
							trip_table.push(trip);
						}
					}
				});
				res.send(trip_table);
			});

		}
	});
},
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to TractsController)
   */
  _config: {}

  
};

var getTime = function(timeMatrix){
	var hour = random(6,9);
	var minutes = random(0,59);
	for(key in timeMatrix){
		if(timeMatrix[key].count > 0){
			hour = timeMatrix[key].hour;
			minutes = random(timeMatrix[key].lowMin,timeMatrix[key].highMin);
			timeMatrix[key].count--;
		}
	}
	return  hour+":"+minutes+'am';
}

var calculateCensus = function(censusData,tract,timeOfDay){
	var output = {percent_trips:0.05,percent_intime:0,timeMatrix:{}};
	if(typeof censusData != 'undefined'){
		if(typeof censusData[tract.home_tract] != 'undefined'){
			output.percent_trips = censusData[tract.home_tract].buspercent;
			var timeSum= 0;
			for(key in censusData[tract.home_tract]){
				if(timeOfDay == 'am'){
					if(['6_00ampt','6_30ampt','7_00ampt','7_30ampt','8_00ampt','8_30ampt','9_00ampt','10_00ampt'].indexOf(key) !== -1){
						timeSum+=censusData[tract.home_tract][key];
					}
				}
			}
			output.percent_intime = timeSum/censusData[tract.home_tract].pttotal;
			if(isNaN(output.percent_intime)){
				output.percent_intime = 1;
			}
		}else{
			output.percent_trips = 0;
		}
	}
	var num_trips = Math.round(tract.bus_total*output.percent_trips*output.percent_intime);
	
	for(key in censusData[tract.home_tract]){
		if(timeOfDay == 'am'){
			if(['6_00ampt','6_30ampt','7_00ampt','7_30ampt','8_00ampt','8_30ampt','9_00ampt','10_00ampt'].indexOf(key) !== -1){
				var hour = 6;
				var lowMin = 0;
				var highMin = 29;
				if(key.length == 8){
					hour = key[0];
					if(key[2] == '3'){
						lowMin = 30;
						highMin = 59;
					}
				}
				if(key.length == 9){
					hour = key.substring(0,2);
					lowMin = 0;
					highMin = 59;
				}
				output.timeMatrix[key] = {'count':Math.round((censusData[tract.home_tract][key]/timeSum)*num_trips*1),'hour':hour,'lowMin':lowMin,'highMin':highMin};
			}
		}
	}
	return output;
}

var getSurveyOD = function(fips_in,callback){
	var sql = "select O_MAT_LAT as o_lat, O_MAT_LONG as o_lng,D_MAT_LAT as d_lat, D_MAT_LONG as d_lng,o_geoid10,d_geoid10 from survey_geo where o_geoid10 in "+fips_in+" and d_geoid10 in "+fips_in+" and not O_MAT_LAT = 0 and not O_MAT_LONG = 0 and not D_MAT_LAT= 0 and not D_MAT_LONG = 0";
	Gtfs.query(sql,{},function(err,points_data){

		if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		
		var origin_points = {};
		var destination_points = {};

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
		callback(origin_points,destination_points);
	});
};

var getStopsOD = function(fips_in,callback){
	var sql = "SELECT a.geoid11,b.stop_lat,b.stop_lon FROM stop_fips as a join \"njtransit_bus_07-12-2013\".stops as b on a.stop_id  = cast(b.stop_id as integer) where a.geoid11 in "+fips_in;
	
	Gtfs.query(sql,{},function(err,points_data){

		if (err) {  return console.log(err);}
		
		var stop_points = {};
		
		points_data.rows.forEach(function(trip){
			
			if(trip.geoid11 in stop_points){
				stop_points[trip.geoid11].push([trip.stop_lat*1,trip.stop_lon*1]);
			}else{
				
				stop_points[trip.geoid11] = [];
				stop_points[trip.geoid11].push([trip.stop_lat*1,trip.stop_lon*1]);
			}
			
		});
		callback(stop_points);
	});
};


var preserveProperties = function(properties, key, value) {
	properties[key] = value;
	return true;
};

var  pointVariation = function(){
	var plusOrMinus = Math.random() < 0.5 ? -1 : 1;
	return random(0,20)/10000*plusOrMinus;
};

function random(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}