/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing marketareas
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

var topojson = require("topojson");

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

    var sql = 'SELECT * FROM public.'+table+' where geoid in '+marketarea.zones.replace(/\"/g,"'").replace("[","(").replace("]",")");
    MarketArea.query(sql,{},function(err,data){
      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
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
                    sql += "WHERE route_id = '" + route_id + "'";
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
                      // retrieve properties
                routeFeature.properties = {};
                routeFeature.properties.route_id = route.route_id;
                routeFeature.properties.short_name = route.route_short_name;
                routeFeature.properties.long_name = route.route_long_name;
                routesCollection.features.push(routeFeature);
            });

            res.send(routesCollection);
        });
    })
  },

  getAllMARoutes: function(req,res) {
      var gtfs_id = req.param('id'),
          shortNames = req.param('routes');

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
              topology = topojson.simplify(topology, {"minimum-area":7e-6,
                                  "coordinate-system":"cartesian"});

              res.send(topology);
          });
      })
      function preserveProperties(p, k, v) {
          p[k] = v;
      }
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
/*****************/

  show:function(req,res){
    var cenData = 'acs5_34_2011_tracts';
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

