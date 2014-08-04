/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var exec = require('child_process').exec

module.exports = {
	loadData:function(req,res){
		var state=req.param('state'),
		dataSource=req.param('dataSource'),
		year=req.param('year'),
		sumlevel=req.param('sumlevel');

		console.log('MetaAcs.loadData',state,dataSource,year,sumlevel)
		
		Job.create(
				{isFinished:false,
				 type:'load-acs',
				 info:[{'state':state,'dataSource':dataSource,'year':year,'sumlevel':sumlevel}]
				})
		.exec(function(err,job){
			var flashMessage = [{
				name:"Test",
				message: "job created "+job.id,
			}];
			req.session.flash = {
				err: flashMessage
			}
			res.redirect('/data/acs');
			return;
			
		})
			
	}
};
