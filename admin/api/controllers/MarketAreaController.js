/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing marketareas
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var topojson = require("topojson");
var fs = require('fs');
var ogr2ogr = require('ogr2ogr');
var censusTracts = require('tracts.json')
var acs_data = require('acs_data').acs_data;
var preserveProperties = function(feature) {
  return feature.properties;
}


function getDatasources(cb){
  var datasources = {} 
  MetaGtfs.find().exec(function(err,mgtfs){
    if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
    datasources.gtfs = mgtfs;
    MetaAcs.find().exec(function(err,macs){
      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
      datasources.acs = macs;
      MetaLodes.find().exec(function(err,mlodes){
        if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
        datasources.lodes = mlodes;
        MetaCtpp.find().exec(function(err,mctpp){
          if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
          datasources.ctpp = mctpp;
          cb(datasources);
        });
      });
    });
  });
}

function getNavData(cb){
  MarketArea.find().exec(function(err,ma){
    if (err) {res.send('{status:"error",message:"'+err+'"}',500);return console.log(err);}
    var output = {};
    output.marketareas = [];
    ma.forEach(function(area){
      output.marketareas.push({id:area.id,name:area.name});
    });
    return cb(output);
  });
}


function getOverviewData(marketarea,cb){
  var output = {};
  MetaGtfs.find().exec(function(err,mgtfs){
    if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
    output.metagtfs = mgtfs;
    var currentGTFS = {};
    mgtfs.forEach(function(gtfs){ if(gtfs.id === marketarea.origin_gtfs){ currentGTFS = gtfs; } });
    var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+currentGTFS.tableName+'.routes';
    MetaGtfs.query(sql,{},function(err,data){
      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
      output.fullroutes = data.rows;
      return cb(output);
    });
  });
}

function getCensusData(marketarea,table,cb){

    var sql = 'SELECT a.*,b.aland FROM public.'+table+' as a'
          + ' join tl_2013_34_tract as b on a.geoid = b.geoid'
          + ' where a.geoid in '+JSON.stringify(marketarea.zones).replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) { return console.log(err,sql);}
      return cb(data.rows);
    });
}

function getRoutes(marketarea,cb){
  var output = {};
  MetaGtfs.find().exec(function(err,mgtfs){
    if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
    output.metagtfs = mgtfs;
    var currentGTFS = {};
    mgtfs.forEach(function(gtfs){ if(gtfs.id === marketarea.origin_gtfs){ currentGTFS = gtfs; } });
    var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+currentGTFS.tableName+'.routes';
    MetaGtfs.query(sql,{},function(err,data){
      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
      output.fullroutes = data.rows;
      return cb(output);
    });
  });
}

module.exports = {
  
  new:function(req,res){
    getNavData(function(navData){
      MetaGtfs.find().exec(function(err,metaGTFS){
        res.view({marketarea:0,page:'ma-new',panel:'marketarea',gtfs:metaGTFS,nav:navData})
      })
    })
  },
  getRouteGeo:function(req,res){
    var gtfs_id = req.param('id'),
        route_id = req.param('route');

    if (!(gtfs_id && route_id)) {
      res.send({status: 500, error: 'You must supply a table ID and route ID'}, 500);
      return;
    }
   

    MetaGtfs.findOne(gtfs_id).exec(function(err,mgtfs){
        var sql = "SELECT route_id, route_short_name, route_long_name, ST_AsGeoJSON(geom) as the_geom " +
                  "FROM "+mgtfs.tableName+".routes ";
                  if(route_id instanceof Array){
                    sql += "WHERE route_short_name in " + JSON.stringify(route_id).replace(/\"/g,"'").replace("[","(").replace("]",")");
                  }else{
                    sql += "WHERE route_short_name = '" + route_id + "'";
                  }

        MetaGtfs.query(sql,{},function(err,data){
            if (err) {
                res.send('{status:"error",message:"'+err+'"}',500);
                return console.log(err);
            }
            var routesCollection = {};
            routesCollection.type = "FeatureCollection";
            routesCollection.features = [];
            
            // for each result in the result set, generate a new geoJSON feature object
            data.rows.forEach(function(route){
                var routeFeature = {};
                routeFeature.type="Feature";
                      // retrieve geometry data
                routeFeature.geometry = JSON.parse(route.the_geom);
                
                routeFeature.geometry.type = 'LineString';
                routeFeature.geometry.coordinates = routeFeature.geometry.coordinates.reduce(function(a, b) { return a.length > b.lemgth ? a : b; }, []);
                      // retrieve properties
                routeFeature.properties = {};
                routeFeature.properties.route_id = route.route_id;
                routeFeature.properties.short_name = route.route_short_name;
                routeFeature.properties.long_name = route.route_long_name;
                routesCollection.features.push(routeFeature);
            });

            var topology = topojson.topology({routes: routesCollection},{"property-transform":preserveProperties,
                                               "quantization": 1e6});

            var newJson = {type:'FeatureCollection',features:[]};
            topology.objects.routes.geometries.forEach(function(d){
              var routeSwap = {type: "GeometryCollection", geometries:[d]}
              var test = topojson.mesh(topology, routeSwap, function(a, b) { return a.properties; });
              var feature = {type:'Feature', properties:d.properties, geometry:{type:test.type, coordinates:test.coordinates}};
              newJson.features.push(feature);
            })

            res.send(newJson);
        });
    })
  },

  getAllMARoutes: function(req,res) {
      var gtfs_id = req.param('id'),
          shortNames = req.param('routes'),
          type = 'routes';

      if(typeof req.param('type') != 'undefined'){
        type = req.param('type');
      }

      var routes_in = "(";
      shortNames.forEach(function(tract){
          routes_in += "'"+tract+"',";
      });
      routes_in = routes_in.slice(0, -1)+")";

      var routesCollection = {
        type: "FeatureCollection",
        features: []
      };

      MetaGtfs.findOne(gtfs_id).exec(function(err, mgtfs){

          if(type == 'stops'){
            var sql = 'SELECT ST_AsGeoJSON(stops.geom) stop_geom,a.stop_num,a.line,a.fare_zone,stops.stop_id '+
                      'FROM fare_zones as a '+
                      'join "njtransit_bus_07-12-2013".stops on a.stop_num = stops.stop_code '+
                      'where a.line in '+routes_in;
            MetaGtfs.query(sql,{},function(err,data){
                if (err) {
                    res.send({ status:500, error: err }, 500);
                    return console.log(err);
                }
                var stops =[];
                data.rows.forEach(function(stop){
                  if(stops.indexOf(stop) == -1){
                    var Feature = {};
                    Feature.type="Feature";
                    Feature.geometry = JSON.parse(stop.stop_geom);
                    Feature.properties = {};
                    Feature.properties.stop_code = stop.stop_code;
                    Feature.properties.fare_zone = stop.fare_zone;
                    Feature.properties.stop_id = stop.stop_id;

                    routesCollection.features.push(Feature);
                  }

                });
                //console.log(routesCollection);
                res.json(routesCollection);

            });

          }else{

            var sql = 'SELECT ST_AsGeoJSON(geom) AS route_shape,route_id,route_short_name '+
                      'FROM '+mgtfs.tableName+'.routes '+
                      'WHERE route_short_name IN '+routes_in;

            MetaGtfs.query(sql,{},function(err,data){
                if (err) {
                    res.send({ status:500, error: err }, 500);
                    return console.log(err);
                }

                data.rows.forEach(function(route){
                    var routeFeature = {};
                    routeFeature.type="Feature";
                    routeFeature.geometry = JSON.parse(route.route_shape);

                    routeFeature.geometry.type = 'LineString';
                    routeFeature.geometry.coordinates = routeFeature.geometry.coordinates.reduce(function(a, b) { return a.length > b.lemgth ? a : b; }, []);

                    routeFeature.properties = {};
                    routeFeature.properties.route_id = route.route_id;
                    routeFeature.properties.route_short_name = route.route_short_name;
                    routeFeature.properties.route_long_name = route.route_long_name;
                    routeFeature.properties.route_color = route.route_color;

                    routesCollection.features.push(routeFeature);
                });

                var topology = topojson.topology({routes: routesCollection},{"property-transform":preserveProperties,
                                               "quantization": 1e6});

                var newJson = {type:'FeatureCollection',features:[]};
                topology.objects.routes.geometries.forEach(function(d){
                  var routeSwap = {type: "GeometryCollection", geometries:[d]}
                  var test = topojson.mesh(topology, routeSwap, function(a, b) { return a.properties; });
                  var feature = {type:'Feature', properties:d.properties, geometry:{type:test.type, coordinates:test.coordinates}};
                  newJson.features.push(feature);
                })

                //res.send(topology);
                res.send(newJson);
            });
          }
      })
      
  },

  getAllCTPPoutbound: function(req, res) {
      var sql = "SELECT from_tract as tract, sum(est) as amount " +
                "FROM ctpp_34_2010_tracts " +
                "GROUP BY from_tract";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }

          var response = {};
          data.rows.forEach(function(row) {
              response[row.tract] = row.amount;
          })
          res.json(response);
      })
  },
  getCTPPoutbound: function(req, res) {
      var tractGeoID = req.param('id');

      if (!tractGeoID) {
          res.send({status: 500, message: 'you must supply a tract GeoID'}, 500);
          return;
      }

      var sql = "SELECT to_tract, est, se " +
                "FROM ctpp_34_2010_tracts " +
                "WHERE from_tract = '" + tractGeoID + "'";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }
          var response = [];
          data.rows.forEach(function(row) {
              var obj = {
                  geoid: row.to_tract,
                  est: row.est,
                  se: row.se
              };

              response.push(obj);
          })
          res.send(response);
      })
  },
  getAllCTPPinbound: function(req, res) {
      var sql = "SELECT to_tract as tract, sum(est) as amount " +
                "FROM ctpp_34_2010_tracts " +
                "GROUP BY to_tract";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }

          var response = {};
          data.rows.forEach(function(row) {
              response[row.tract] = row.amount;
          })
          res.json(response);
      })
  },
  getCTPPinbound: function(req, res) {
      var tractGeoID = req.param('id');

      if (!tractGeoID) {
          res.send({status: 500, message: 'you must supply a tract GeoID'}, 500);
          return;
      }

      var sql = "SELECT from_tract, est, se " +
                "FROM ctpp_34_2010_tracts " +
                "WHERE to_tract = '" + tractGeoID + "'";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }
          var response = [];
          data.rows.forEach(function(row) {
              var obj = {
                  geoid: row.from_tract,
                  est: row.est,
                  se: row.se
              };

              response.push(obj);
          })
          res.send(response);
      })
  },
/****************/
  getAllLODEStowork: function(req, res) {
      var sql = "SELECT h_geocode, sum(s000) as amount " +
                "FROM lodes_34_2010_tracts " +
                "GROUP BY h_geocode";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }
          
          var response = {};
          data.rows.forEach(function(row) {
              response[row.h_geocode] = row.amount;
          })
          res.json(response);
      })
  },
  getLODEStowork: function(req, res) {
      var tractGeoID = req.param('id');

      if (!tractGeoID) {
          res.send({status: 500, message: 'you must supply a tract GeoID'}, 500);
          return;
      }

      var sql = "SELECT w_geocode, s000 " +
                "FROM lodes_34_2010_tracts " +
                "WHERE h_geocode = '" + tractGeoID + "'";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }
          var response = [];
          data.rows.forEach(function(row) {
              var obj = {
                  geoid: row.w_geocode,
                  amount: row.s000
              };

              response.push(obj);
          })
          res.send(response);
      })
  },
  getAllLODEStohome: function(req, res) {
      var sql = "SELECT w_geocode, sum(s000) as amount " +
                "FROM lodes_34_2010_tracts " +
                "GROUP BY w_geocode";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }
          
          var response = {};
          data.rows.forEach(function(row) {
              response[row.w_geocode] = row.amount;
          })
          res.json(response);
      })
  },
  getLODEStohome: function(req, res) {
      var tractGeoID = req.param('id');

      if (!tractGeoID) {
          res.send({status: 500, message: 'you must supply a tract GeoID'}, 500);
          return;
      }

      var sql = "SELECT h_geocode, s000 " +
                "FROM lodes_34_2010_tracts " +
                "WHERE w_geocode = '" + tractGeoID + "'";

      MarketArea.query(sql, {}, function(error, data) {
          if (error) {
              console.log("error executing "+sql, error);
              res.send({status: 500, message: 'internal error'}, 500);
              return;
          }
          var response = [];
          data.rows.forEach(function(row) {
              var obj = {
                  geoid: row.h_geocode,
                  amount: row.s000
              };

              response.push(obj);
          })
          res.send(response);
      })
  },
  getCensus:function(req,res){

    var cenData = 'acs5_34_2010_tracts';
    if(typeof req.param('tableName') != 'undefined'){
      cenData = req.param('tableName')
    }
    //Allow user to specify census table
    if(typeof req.param('census') !== 'undefined'){  cenData = req.param('census'); }
    MarketArea.findOne(req.param('id')).exec(function(err,ma){
      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
      getOverviewData(ma,function(meta){
        getCensusData(ma,cenData,function(census){
          //console.log(census);
          res.json({marketarea:ma,census:census})
        })
      })
    })

  },
/************************/

  geoJsonToShp:function(req,res){
    var geoOutput = {
      type:'FeatureCollection',
      features:[]
    },
    finalGeo = {
        type:'FeatureCollection',
        features:[]
    };
    
    if(typeof req.param('geoData') == 'undefined'){
      console.log('no json');
      res.json({responseText:'Error - no json specified'})
    }
    
    var geoData = req.param('geoData');
    censusTracts.features.forEach(function(feat){
      if(geoData.zones.indexOf(feat.properties.geoid) > -1){
        geoOutput.features.push(feat);
      }
    })
    getCensusData(geoData,geoData.outputName,function(census){
      var acs = {};
      census.forEach(function(tract){
        acs[tract.geoid] = {};
        for (var census_var in acs_data.census_vars){
          var value = 0;

          for(var x = 0; x < acs_data.census_vars[census_var].vars.length; x++ ){
             value+=tract[acs_data.census_vars[census_var].vars[x]]*1;
          }

          acs[tract.geoid][census_var] = value;
        }
      });
     
      geoOutput.features.forEach(function(feat,i){
        for(key in acs_data.census_vars){
          
          feat.properties[key] = 0;
          if(typeof acs[feat.properties.geoid] != 'undefined'){
            feat.properties[key] += acs[feat.properties.geoid][key];
          }
          //else{ console.log('no census',feat.properties.geoid); }
        
        }
        feat.properties.emp_den = feat.properties.employment / (feat.properties.aland*0.000000386102159);
        feat.properties.pop_den = feat.properties.total_population / (feat.properties.aland*0.000000386102159);
        finalGeo.features.push(feat);
      });
      //console.log(geoOutput.features[0].properties);

      var ogr = ogr2ogr(finalGeo)
      var data = geoData.json;
      ogr.format('shp').exec(function (er, buf) {
        if (er) return res.json({ errors: er.message.replace('\n\n','').split('\n') })
        fs.writeFile('.tmp/public/data/acs/'+geoData.name+'_'+geoData.outputName+'.zip', buf, function(err) {
          if(err) {
              console.log(err);
          } else {
              
              res.json({url:'/data/acs/'+geoData.name+'_'+geoData.outputName+'.zip'})
              //console.log('finished');
          }
        }); 
       
      });
    });  
    
    
  },

/*****************/
  
  show:function(req,res){
    var cenData = 'acs5_34_2010_tracts';
    //Allow user to specify census table
    if(typeof req.param('census') !== 'undefined'){  cenData = req.param('census'); }

    getNavData(function(navData){
      MarketArea.findOne(req.param('id')).exec(function(err,ma){
        if (err) {res.send('{status:"error",message:"'+err+'"}',500);return console.log(err);}
        getOverviewData(ma,function(meta){
          getCensusData(ma,cenData,function(census){
            //console.log(census);
            res.view({page:'ma-overview',panel:'marketarea',nav:navData,marketarea:ma,meta:meta,census:census})
          })
        })
      })
    })
  },
  models:function(req,res){
    var datasources = {}
    getNavData(function(navData){
      MarketArea.findOne(req.param('id')).exec(function(err,ma){
        if (err) {res.send('{status:"error",message:"'+err+'"}',500);return console.log(err);}
        getDatasources(function(datasources){
          res.view({page:'ma-models',panel:'marketarea',nav:navData,marketarea:ma,ds:datasources})
        });
      })
    });
  },
};

