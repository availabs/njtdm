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
 

module.exports = {
  

  dashboard:function(req,res){
  	res.view({page:'dashboard',panel:'none'});
  },
  gtfs:function(req,res){
  	res.view({page:'gtfs',panel:'data'});
  },
  acs:function(req,res){
  	MetaAcs.find().exec(function(err,meta){
        res.view({page:'acs',panel:'data',error:err,records:meta});
    });
  },
  ctpp:function(req,res){
  	MetaCtpp.find().exec(function(err,meta){
        res.view({page:'ctpp',panel:'data',error:err,records:meta});
    });
  },
  lodes:function(req,res){
  	MetaLodes.find().exec(function(err,meta){
        res.view({page:'lodes',panel:'data',error:err,records:meta});
    });
  },
  marketareaNew:function(req,res){
    res.view({page:'ma-new',panel:'marketarea'})
  },
  gtfs_file_upload:function(req,res){
    //console.log(req.file('files'));
    if(typeof req.file('files[]') != 'undefined'){
      req.file('files[]').upload(function (err, files) {
      if (err) return res.serverError(err);
        console.log(files);
        return res.json({
          message: files.length + ' file(s) uploaded successfully!',
          o:{files: files}
        });
      });
    }

  },

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to HomeController)
   */
  _config: {}

  
};
