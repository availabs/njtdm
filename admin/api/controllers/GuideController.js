/**
 * GuideController
 *
 * @description :: Server-side logic for managing guides
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

module.exports = {
    
  overview:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  getting_started:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  quickstart:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  gtfs:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  acs:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  ctpp:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  lodes:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  farebox:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  lodes:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  new_market_area:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  edit_market_area:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  mapmodeling:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  mapgtfs:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  custom_data:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  mapcensus:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  quickstart:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  triptables:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  odsources:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  },
  regression:function(req,res){
    getNavData(function(navData){
        res.view({page:'quickstart',panel:'guide',nav:navData})
    })
  }
};  

