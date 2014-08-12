/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing marketareas
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
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

function getRoutess(marketarea,cb){
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
        res.view({page:'ma-new',panel:'marketarea',gtfs:metaGTFS,nav:navData})
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
                  "FROM "+mgtfs.tableName+".routes " +
                  "WHERE route_id = '" + route_id + "'";
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
            console.log("??? ok route geo")
        });
    })
  },
  show:function(req,res){
    var cenData = 'acs5_34_2011_tracts';
    //Allow user to specify census table
    if(typeof req.param('census') !== 'undefined'){  cenData = req.param('census'); }

    getNavData(function(navData){
      MarketArea.findOne(req.param('id')).exec(function(err,ma){
        if (err) {res.send('{status:"error",message:"'+err+'"}',500);return console.log(err);}
        getOverviewData(ma,function(meta){
          getCensusData(ma,cenData,function(census){
            console.log(census);
            res.view({page:'ma-overview',panel:'marketarea',nav:navData,marketarea:ma,meta:meta,census:census})
          })
        })
      })
    })
  },
  models:function(req,res){
    getNavData(function(navData){
      MarketArea.findOne(req.param('id')).exec(function(err,ma){
        if (err) {res.send('{status:"error",message:"'+err+'"}',500);return console.log(err);}
        res.view({page:'ma-models',panel:'marketarea',nav:navData,marketarea:ma})
      });
    })
  },
};

