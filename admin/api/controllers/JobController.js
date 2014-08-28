/**
 * JobsController
 *
 * @description :: Server-side logic for managing jobs
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

function getNavData(cb){
  MarketArea.find().exec(function(err,ma){
    var output = {};
    output.marketareas = [];
    ma.forEach(function(area){
      output.marketareas.push({id:area.id,name:area.name,numTracts:JSON.parse(area.zones).length,numRoutes:JSON.parse(area.routes).length});
    });
    return cb(output);
  });
}

module.exports = {
	
	dash : function(req,res){
	
		getNavData(function(navData){
		  	Job.find().exec(function(err,jobs){
	      		res.view({marketarea:0,page:'jobs',panel:'none',title:"Dashboard | NJTDM",nav:navData,jobs:jobs});
	  		});
	    });
	}
};

