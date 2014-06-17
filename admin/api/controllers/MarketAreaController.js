/**
 * MarketAreaController
 *
 * @description :: Server-side logic for managing marketareas
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
function getNavData(cb){
  MarketArea.find().exec(function(err,ma){
    var output = {};
    output.marketareas = [];
    ma.forEach(function(area){
      output.marketareas.push({id:area.id,name:area.name});
    });
    return cb(output);
  });
}

module.exports = {
  
  manew:function(req,res){
    getNavData(function(navData){
      res.view({page:'ma-new',panel:'marketarea',title:"New Market Area | NJTDM",nav:navData})
    })
  },
  overview:function(req,res){
    getNavData(function(navData){
      res.view({page:'ma-overview',panel:'marketarea',title:"New Market Area | NJTDM",nav:navData})
    })
  },
  models:function(req,res){
    getNavData(function(navData){
      res.view({page:'ma-models',panel:'marketarea',title:"New Market Area | NJTDM",nav:navData})
    })
  },
};

