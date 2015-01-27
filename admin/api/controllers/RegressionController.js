/**
 * RegressionController
 *
 * @description :: Server-side logic for managing regressions
 * @help        :: See http://links.sailsjs.org/docs/controllers
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
	index:function(req,res){
	  getNavData(function(navData){
      res.view({marketarea:0,page:'regression',panel:'none',title:"Dashboard | NJTDM",nav:navData});
    })
  },
};

