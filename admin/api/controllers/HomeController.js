/**
 * HomeController
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
function getNavData(cb){
  MarketArea.find().exec(function(err,ma){
    var output = {};
    output.marketareas = [];
    ma.forEach(function(area){
      output.marketareas.push({id:area.id,name:area.name,numTracts:area.zones.length,numRoutes:area.routes.length});
    });
    return cb(output);
  });
}

module.exports = {
  

  dashboard:function(req,res){
	  getNavData(function(navData){
      res.view({marketarea:0,page:'dashboard',panel:'none',title:"Dashboard | NJTDM",nav:navData});
    })
  },
  
  gtfs:function(req,res){
    getNavData(function(navData){
      MetaGtfs.find().exec(function(err,meta){
  	   res.view({marketarea:0,page:'gtfs',panel:'data',records:meta,title:"GTFS | NJTDM",nav:navData});
     });
    });
  },
  
  acs:function(req,res){
  	getNavData(function(navData){
      MetaAcs.find().exec(function(err,meta){
        res.view({marketarea:0,page:'acs',panel:'data',error:err,records:meta,title:"ACS | NJTDM",nav:navData});
      });
    })
  },
  
  ctpp:function(req,res){
    getNavData(function(navData){
    	MetaCtpp.find().exec(function(err,meta){
          res.view({marketarea:0,page:'ctpp',panel:'data',error:err,records:meta,title:"CTPP | NJTDM",nav:navData});
      });
    });
  },
  
  lodes:function(req,res){
    getNavData(function(navData){
    	MetaLodes.find().exec(function(err,meta){
          res.view({marketarea:0,page:'lodes',panel:'data',error:err,records:meta,title:"LODES | NJTDM",nav:navData});
      });
    });
  },
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to HomeController)
   */
  _config: {}

  
};
