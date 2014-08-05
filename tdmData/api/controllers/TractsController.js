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
scenarioTracts: function(req,res,$http){
	var scenarioSQL = 'select tracts from scenario where id = '+req.param('scenarioid');
	Gtfs.query(scenarioSQL,{},function(err,scenario_tracts){
		if (err) { res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
		var sql = 'select ST_AsGeoJSON(the_geom) as geo,geoid from tl_2013_34_tract where geoid in '+scenario_tracts.rows[0].tracts.replace('[','(').replace(']',')').replace(/"/g, '\'');
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
	});
},
acs : function(req,res){
	var where = '';
	if (!req.param('tracts') instanceof Array) {
		var fips_in = "(";
		req.param('tracts').forEach(function(tract){
			
			fips_in += "'"+tract+"',";
		});
		fips_in = fips_in.slice(0, -1)+")";
		where = 'where geoid in '+fips_in;
	}
	
	var sql = 'select * from tl_2011_34_tract_acs '+ where;

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
	var randomness = (random(0,20)/10000);
	randomness = 0;
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
						trip.from_coords = [tract.on_lat*1+randomness,tract.on_lng*1+randomness];
					}else{
						trip.from_coords = [tract.o_lat*1+randomness,tract.o_lng*1+randomness];
					}
					trip.to_coords = [tract.d_lat*1+randomness,tract.d_lng*1+randomness];
					
					d = new Date(tract.militarystarttime);
					trip.time = d.getHours()+":"+d.getMinutes()+"am";
					trip.source ="AC Survey";
					trip_table.push(trip);
				}
			});
			res.send({'tt':trip_table});
		});
	});
},
generateTrips : function(req,res){
	/* mode : lehd || ctpp
	// tracts : an array of census tracts fip11 ids
	// odtype : stops, survey, [parcels]
	// marketarea: market area id
	//  
	//*/
	
	var version = "0.0.6";
	var mode = 'lehd'
	if(typeof req.param('mode') != 'undefined'){ mode =req.param('mode');}
	if (!req.param('tracts') instanceof Array) { res.send('Must post Array of 11 digit fips codes to LEHD Trip Table');}
	var odtype = "stops";
	if(typeof req.param('od') != 'undefined'){ odtype =req.param('od');}
	var timeOfDay = "am";
	if(typeof req.param('timeOfDay') != 'undefined'){ timeOfDay = req.param('timeOfDay');}
	var marketArea = 0;
	if(typeof req.param('marketarea') != 'undefined'){ marketArea = req.param('marketarea');}
	console.log(mode+version+' '+odtype+' '+timeOfDay+' '+marketArea)
	var output = [],
		trip_table = [], 
		cantRoute = [];
	var fips_in = toPostgresArray(req.param('tracts'));
					
	fips_in = fips_in.slice(0, -1)+")";

	console.log("generate trips",'mode',mode,'odtype',odtype)
	var sql="SELECT h_geocode as home_tract, w_geocode as work_tract, s000 as bus_total from nj_od_j00_ct where s000 > 5 and (h_geocode in "+fips_in+" or w_geocode in "+fips_in+")";
	if(mode == 'ctpp'){
		sql="SELECT from_tract as home_tract, to_tract as work_tract, est as bus_total from ctpp_a302103_tracts where (from_tract in "+fips_in+" or to_tract in "+fips_in+")";
	}
	//console.log('ctpp sql',sql);
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
					if(typeof req.param('cenData')!= 'undefined'){
						if(typeof req.param('cenData')[tract.home_tract] != 'undefined'){
							//var regessionRiders = Math.round(38.794+(req.param('cenData')[tract.home_tract].car_0*0.544)+(req.param('cenData')[tract.home_tract].arts*0.158)+(req.param('cenData')[tract.home_tract].race_white*-0.027));
							var regressionRiders =  0;
								if(marketArea == 0){
									regressionRiders = 27.19931+req.param('cenData')[tract.home_tract].car_0*0.5003613;
									regressionRiders += req.param('cenData')[tract.home_tract].car_1*0.1239196;
									regressionRiders += req.param('cenData')[tract.home_tract].foreign_born*0.1054442;
									regressionRiders += req.param('cenData')[tract.home_tract].foreign_born*0.1054442;
									regressionRiders += req.param('cenData')[tract.home_tract]['30000_34999']*0.1834702;
									regressionRiders += req.param('cenData')[tract.home_tract]['50000_59999']*0.2794759;
									regressionRiders += req.param('cenData')[tract.home_tract]['50+_units']*0.07907048;
									regressionRiders += req.param('cenData')[tract.home_tract].race_black*0.03785962;
									regressionRiders += req.param('cenData')[tract.home_tract].race_other*-0.05642658;
									regressionRiders += req.param('cenData')[tract.home_tract].occupancy_renter*-0.06249458;
									regressionRiders += req.param('cenData')[tract.home_tract].occupied_housing*-0.09579623;
									//console.log('rr',regressionRiders);
								}else if(marketArea == 1){
									// regressionRiders = 38.794+req.param('cenData')[tract.home_tract].car_0*0.743
									// regressionRiders += req.param('cenData')[tract.home_tract].car_1*0.141
									// regressionRiders += req.param('cenData')[tract.home_tract].race_white*-0.027
									console.log('princeton reg')

									// regressionRiders = 3.520174+req.param('cenData')[tract.home_tract].car_0*0.3594752
									// regressionRiders += req.param('cenData')[tract.home_tract].car_1*0.141
									// regressionRiders += req.param('cenData')[tract.home_tract].age25_29*-0.027

									regressionRiders = 3.520174+req.param('cenData')[tract.home_tract].car_0*0.3594752;
									regressionRiders += req.param('cenData')[tract.home_tract].age_25_29*0.1261646;
									regressionRiders += req.param('cenData')[tract.home_tract].race_black*0.02306711;
									regressionRiders += req.param('cenData')[tract.home_tract].poverty_st*-0.04343183;

								}

							if(req.param('buspercent')[tract.home_tract].bus_to_work > 0){
								regPercent= Math.ceil(regressionRiders) / req.param('buspercent')[tract.home_tract].bus_to_work;
							}else{
								regPercent= 1;
							}	
						}
						// if(tract.home_tract == '34009021400'){
						// console.log('what is happeniing?',regessionRiders,regPercent,req.param('cenData')[tract.home_tract].car_0,req.param('cenData')[tract.home_tract].car_1);
						// }
						num_trips =  tract.bus_total*percent_intime*Math.abs(regPercent);
					}else if(mode == 'ctpp'){
						num_trips = tract.bus_total*percent_intime;
						
					}else{
						num_trips = Math.round(tract.bus_total*percent_trips);
						
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
						}else{
							cantRoute.push(trip);
						}
					}
				});
				res.send({'tt':trip_table,'failed':cantRoute});
			});
		}else if(odtype == "stops"){
			getStopsOD(tracts_data,function(stop_points){
				var id = 0;
				tracts_data.rows.forEach(function(tract){
					
					if(typeof req.param('buspercent') != 'undefined'){
						var vars = calculateCensus(req.param('buspercent'),tract,timeOfDay,mode);
						var percent_trips =  vars.percent_trips;
						var percent_intime = vars.percent_intime;
						var timeMatrix = vars.timeMatrix;
					}

					if(typeof req.param('cenData')!= 'undefined'){
						var regPercent = 1;
						if(typeof req.param('cenData')[tract.home_tract] != 'undefined'){
							
							var regressionRiders =  0;
							if(marketArea == 0){
								// regressionRiders = 27.19931+req.param('cenData')[tract.home_tract].car_0*0.5003613;
								// regressionRiders += req.param('cenData')[tract.home_tract].car_1*0.1239196;
								// regressionRiders += req.param('cenData')[tract.home_tract].foreign_born*0.1054442;
								// regressionRiders += req.param('cenData')[tract.home_tract]['30000_34999']*0.1834702;
								// regressionRiders += req.param('cenData')[tract.home_tract]['50000_59999']*0.2794759;
								// regressionRiders += req.param('cenData')[tract.home_tract]['50+_units']*0.07907048;
								// regressionRiders += req.param('cenData')[tract.home_tract].race_black*0.03785962;
								// regressionRiders += req.param('cenData')[tract.home_tract].race_other*-0.05642658;
								// regressionRiders += req.param('cenData')[tract.home_tract].occupancy_renter*-0.06249458;
								// regressionRiders += req.param('cenData')[tract.home_tract].occupied_housing*-0.09579623;
								

								// regressionRiders = req.param('cenData')[tract.home_tract].car_0*0.629;
								// regressionRiders += req.param('cenData')[tract.home_tract].car_1*0.134;
								// regressionRiders += req.param('cenData')[tract.home_tract].information*-0.787;


								regressionRiders = -19.35818 + req.param('cenData')[tract.home_tract].car_0* 0.5432931;
								regressionRiders += req.param('cenData')[tract.home_tract].car_1*0.1331132;
								regressionRiders += req.param('cenData')[tract.home_tract].information*-0.7130553;
								regressionRiders += req.param('cenData')[tract.home_tract].employment_density*-8.155064.toExponential(-10);

								///console.log('rr',regressionRiders);
							}else if(marketArea == 1){
								regressionRiders = -0.04630396+req.param('cenData')[tract.home_tract].car_0* 0.2751065;
								regressionRiders += req.param('cenData')[tract.home_tract].race_black* 0.01149703;
								regressionRiders += req.param('cenData')[tract.home_tract].age18_19*-0.08908261;
								regressionRiders += req.param('cenData')[tract.home_tract].age25_29*  0.1412946;
								regressionRiders += req.param('cenData')[tract.home_tract]['20_49units']*  0.1392643;
								regressionRiders += req.param('cenData')[tract.home_tract]['10_19units']*-0.07791869;
								
							}

							if(req.param('buspercent')[tract.home_tract].bus_to_work > 0){
								regPercent= Math.round(regressionRiders) / req.param('buspercent')[tract.home_tract].bus_to_work;
							}else{
								regPercent= 0;
							}	
							//console.log('per',regPercent,regressionRiders,req.param('buspercent')[tract.home_tract].bus_to_work);
						}
						if(tract.home_tract == '34011040700'){
						console.log('what is happeniing?',regressionRiders,req.param('buspercent')[tract.home_tract].bus_to_work,regPercent,tract.bus_total,req.param('cenData')[tract.home_tract].car_0,req.param('cenData')[tract.home_tract].car_1);
						}
						num_trips =  tract.bus_total*percent_intime*Math.abs(regPercent);
					}else if(mode == 'ctpp'){
						num_trips = tract.bus_total*percent_intime;			
					}else{
						num_trips = Math.round(tract.bus_total*percent_trips*percent_intime);
					}

					for(var i = 0; i < num_trips;i++){
						var trip = {};
						trip.id = id;
						id += 1;
						
						trip.from_geoid = tract.home_tract;
						trip.to_geoid = tract.work_tract;

						if(timeOfDay == 'pm'){
							trip.from_geoid = tract.work_tract;
							trip.to_geoid = tract.home_tract;
						}

						trip.from_coords = [];
						trip.to_coords = [];
						if(tract.home_tract in stop_points && tract.work_tract in stop_points){
							if(timeOfDay == 'am'){
								trip.from_coords = stop_points[tract.home_tract][random(0,stop_points[tract.home_tract].length-1)];
							}else if(timeOfDay == 'pm'){
								trip.from_coords = stop_points[tract.work_tract][random(0,stop_points[tract.work_tract].length-1)];
							}
							trip.from_coords[0] += pointVariation();
							trip.from_coords[1] += pointVariation();
							
							if(timeOfDay == 'am'){
								trip.to_coords = stop_points[tract.work_tract][random(0,stop_points[tract.work_tract].length-1)];
							}else if(timeOfDay == 'pm'){
								trip.to_coords = stop_points[tract.home_tract][random(0,stop_points[tract.home_tract].length-1)];
							}
							trip.to_coords[0] += pointVariation();
							trip.to_coords[1] += pointVariation();
							
							trip.time = getTime(timeMatrix,timeOfDay);
							trip.source = mode+version;
							trip_table.push(trip);
						}else{
							//console.log('cantroute',trip.to_geoid,trip.from_geoid);
							cantRoute.push(trip);
						}	
					}
				});
				res.send({'tt':trip_table,'failed':cantRoute});
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

var getTime = function(timeMatrix,ampm){
	var hour = random(6,9);
	var minutes = random(0,59);
	min = 0;
	maxKey = 'unset';
	//Find the Time Category with the most trips
	for(key in timeMatrix){
		if(timeMatrix[key].count > min){
			maxKey = key;
			min = timeMatrix[key].count;
		}
	}
	//Schedule the trip for the category
	if(maxKey !== 'unset'){
		hour = timeMatrix[maxKey].hour;
		minutes = random(timeMatrix[maxKey].lowMin,timeMatrix[maxKey].highMin);
		timeMatrix[maxKey].count--;
	}
	if(+minutes < 10){
		minutes = '0'+minutes;
	}
	//console.log('am hour',hour);
	if(ampm == 'pm'){
		hour = +hour+10;
		hour = hour % 12;
	}
	//console.log('pm hour',hour);
	return  hour+":"+minutes+ampm;
}


var calculateCensus = function(censusData,tract,timeOfDay,mode){
	var output = {percent_trips:0.05,percent_intime:0,timeMatrix:{}};
	if(typeof censusData != 'undefined'){
		if(typeof censusData[tract.home_tract] != 'undefined'){
			output.percent_trips = censusData[tract.home_tract].buspercent;
			var amTimeSum= 0,pmTimeSum=0,offpeakSum=0,timeSum;
			
			//---------------------------------------
			// Determine ridership 
			//---------------------------------------
			for(key in censusData[tract.home_tract]){
				if(['6_00ampt','6_30ampt','7_00ampt','7_30ampt','8_00ampt','8_30ampt','9_00ampt','10_00ampt'].indexOf(key) !== -1){
					amTimeSum+=censusData[tract.home_tract][key];
				}
				if(['4_00pmpt'].indexOf(key) !== -1){
					pmTimeSum+=censusData[tract.home_tract][key];
				}
				if(['5_00ampt','5_30ampt','11_00ampt','12_00ampt','12_00pmpt'].indexOf(key) !== -1){
					offpeakSum+=censusData[tract.home_tract][key];
				}
			}

			output.amPercent = amTimeSum/censusData[tract.home_tract].pttotal;
			output.pmPercent = pmTimeSum/censusData[tract.home_tract].pttotal;
			output.offpeakPercent = offpeakSum/censusData[tract.home_tract].pttotal;
			output.percent_intime = output.amPercent;
			timeSum = amTimeSum;
			// if(timeOfDay == 'pm'){
			// 	output.percent_intime = output.amPercent;
			// 	timeSum = pmTimeSum;
			// }

			if(isNaN(output.percent_intime)){
				output.percent_intime = 1;
			}
		}else{
			output.percent_trips = 0;
		}
	}

	var num_trips = tract.bus_total;
	if(mode == 'lehd'){ Math.ceil(num_trips = num_trips*output.percent_trips)};
	
	for(key in censusData[tract.home_tract]){
		
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
			output.timeMatrix[key] = {
				'count':Math.ceil((censusData[tract.home_tract][key]/timeSum)*num_trips*1),
				'hour':hour,
				'lowMin':lowMin,
				'highMin':highMin
			};
		}
		
	}
	return output;
}

var getSurveyOD = function(fips_in,callback){
	var sql = "select O_MAT_LAT as o_lat, O_MAT_LONG as o_lng,D_MAT_LAT as d_lat, D_MAT_LONG as d_lng,o_geoid10,d_geoid10 from survey_geo where o_geoid10 in "+fips_in+" or d_geoid10 in "+fips_in+" and not O_MAT_LAT = 0 and not O_MAT_LONG = 0 and not D_MAT_LAT= 0 and not D_MAT_LONG = 0";
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


var getStopsOD = function(input,callback){
	tract_list = [];
	input.rows.forEach(function(d){
		if(tract_list.indexOf(d.home_tract) == -1){
			tract_list.push(d.home_tract);
		}
		if(tract_list.indexOf(d.work_tract) == -1){
			tract_list.push(d.work_tract);
		}
	});
	var fips_in = "(";
	tract_list.forEach(function(tract){
		fips_in += "'"+tract+"',";
	});
	fips_in = fips_in.slice(0, -1)+")";

	var sql = "SELECT a.geoid11,b.stop_lat,b.stop_lon FROM stop_fips as a join \"njtransit_bus_07-12-2013\".stops as b on a.stop_id  = cast(b.stop_id as integer) where a.geoid11 in "+fips_in;
	//console.log('stop OD Sql',sql);
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
	//return random(0,20)/10000*plusOrMinus;
	return 0
};

function random(min,max)
{
    return Math.floor(Math.random()*(max-min+1)+min);
}
function toPostgresArray(input){
	var output ="(";
	input.forEach(function(tract){
		output += "'"+tract+"',";
	});
	return output.slice(0, -1)+")";
}