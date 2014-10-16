/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */


function spawnJob(job){
	var terminal = require('child_process').spawn('bash');
	var current_progress = 0;
	var acsEntry = { 
		tableName:'',
  	 	stateFips:job.info[0].state,
	 	dataSource: job.info[0].dataSource,
  	 	year:job.info[0].year,
  	 	sumlevel:job.info[0].sumlevel
  	}

  	terminal.stdout.on('data', function (data) {
	    data = data+'';
	    if(data.indexOf('tableName') !== -1){
	    	console.log('table-name',data.split(":")[1]);
	    	acsEntry.tableName = data.split(":")[1];
	    }
	    else if(data.indexOf('status') !== -1){
	    	console.log('status',data.split(":")[1]);
	    	Job.update({id:job.id},{status:data.split(":")[1],progress:0})
    		.exec(function(err,updated_job){
    			if(err){ console.log('job update error',error); }
    			sails.sockets.blast('job_updated',updated_job);		
    		});
	    	current_progress =0;
	    }
	    else if(data.indexOf('progress') !== -1){

	    	if(data.split(":")[1] !== current_progress){
	    		current_progress = data.split(":")[1]
	    		console.log(current_progress);
	    		Job.update({id:job.id},{progress:current_progress})
    			.exec(function(err,updated_job){
    				if(err){ console.log('job update error',error); }
    				sails.sockets.blast('job_updated',updated_job);		
    			});
	    	}
	    }
	    else{
	    	console.log('error probably',data)
	    }
	});

	terminal.on('exit', function (code) {
		code = code*1;
	    console.log('child process exited with code ' + code);
	    if(code == 0){
	    	
	    	Job.findOne(job.id).exec(function(err,newJob){
	    		if(err){ console.log('Job check err',err);}
	    		
	    		if(newJob.status != 'Cancelled'){
			    	
			    	MetaAcs.create(acsEntry)
				    .exec(function(err,newEntry){
				    	if(err){ console.log('metaAcs create error',err);}
							
					    Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success'})
						.exec(function(err,updated_job){
							if(err){ console.log('job update error',err); }
							sails.sockets.blast('job_updated',updated_job);		
						});
					});
				}else{
					console.log('Exit from Job Cancel');
				}
			});
					
		}else{
			Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Failure'})
			.exec(function(err,updated_job){
				if(err){ console.log('job update error',error); }
				sails.sockets.blast('job_updated',updated_job);		
			});
		}
	});

	setTimeout(function() {
	    terminal.stdin.write('php -f php/loadacs.php lor.availabs.org 5432 njtdmData postgres transit '
	    	+' '+job.info[0].state
	    	+' '+job.info[0].dataSource
	    	+' '+job.info[0].year
	    	+'\n');
	    
	    Job.update({id:job.id},{pid:terminal.pid}).exec(function(err,updated_job){
	    	if(err){ console.log('job update error',error); }
			sails.sockets.blast('job_updated',updated_job);		
	    })

	    terminal.stdin.end();
	}, 1000);
}

module.exports = {

	deleteACS:function(req,res){

		MetaAcs.findOne(req.param('id')).exec(function(err,found){
			
			var query = 'DROP TABLE public."'+found.tableName+'"';
			

			MetaAcs.query(query,{} ,function(err, result) { 
				if(err) { console.error('error running query:',query, err); }

				MetaAcs.destroy(found.id).exec(function(err,destroyed){
					if(err) { console.log(err); res.json({error:err}); }

					res.json({'message':'Record '+found.id+' deleted.'})

				});

			});

		});
		
	},

	loadData:function(req,res){
		var state=req.param('state'),
		dataSource=req.param('dataSource'),
		year=req.param('year'),
		sumlevel=req.param('sumlevel');

		console.log('MetaAcs.loadData',state,dataSource,year,sumlevel)
		
		MetaAcs //Check to see if this data set has been loaded
		.find({ stateFips:state,dataSource:dataSource, year:year,sumlevel:sumlevel})
		.exec(function(err,data){
			console.log(data);
			
			if(data.length > 0){// the data source does exist, refuse to load.
				var flashMessage = [{
					name:"Data Exists",
					message: "This dataset has already been loaded"
				}];

				req.session.flash = {
					err: flashMessage
				}
				res.redirect('/data/acs');
			
			}else{//the data source doesn't exists 

				Job.create({
					isFinished:false,
					type:'load ACS',
					info:[{'state':state,'dataSource':dataSource,'year':year,'sumlevel':sumlevel}],
					status:'Started'
				})
				.exec(function(err,job){
					if(err){console.log('create job error',err)
						req.session.flash = {
							err: err
						}
						res.redirect('/data/acs');
						return;
					}
					sails.sockets.blast('job_created',job);

					var flashMessage = [{
						name:"Test",
						message: "job created "+job.id,
					}];

					spawnJob(job);

					req.session.flash = {
						err: flashMessage
					}
					res.redirect('/data/acs');
					return;
					
				})
			}

		})//Check for data source	
	}
};
