/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var password = 'transit';
var conString = "postgres://postgres:"+password+"@lor.availabs.org:5432/njtdmData";

function spawnJob(job){
	var terminal = require('child_process').spawn('bash');
	var current_progress = 0;
	var gtfsEntry = { 
		tableName:job.info[0].schemaName,
  	 	filePath:job.info[0].file.fd,
  		agency:'',
  		startDate:'',
  		endDate:'',
  		numRoutes:0,
  		numStops:''
  	}
  	var current_progress = 0;
  	terminal.stdout.on('data', function (data) {
	    data = data+'';
	    if(data.indexOf('gtfsdb.model') !== -1){
	    	current_progress++;
	    	console.log('Loading',current_progress,data.split(" ")[3]);
	    	Job.update({id:job.id},{status:data.split(" ")[3],progress: ((current_progress/20)*100).toFixed(0) })
    		.exec(function(err,updated_job){
    			if(err){ console.log('job update error',error); }
    			sails.sockets.blast('job_updated',updated_job);		
    		});

	    }
	    else{
	    	console.log('Unrecognized Output::',data)
	    }
	});

	

	terminal.on('exit', function (code) {
		code = code*1;
	    console.log('child process exited with code ' + code);
	    if(code == 0){
	    	Job.findOne(job.id).exec(function(err,newJob){
	    		
	    		if(newJob.status != 'Cancelled'){

			    	var sql = "SELECT agency.agency_name,min(calendar_dates.date) as start_date,max(calendar_dates.date) as end_date FROM "+gtfsEntry.tableName+".calendar_dates,"+gtfsEntry.tableName+".agency group by agency.agency_name"
			    	console.log(sql);
			    	MetaGtfs.query(sql,{},function(err,data){

			    		console.log('select from new gtfs',data);
			    		if(data.rows.length > 0){
				    	  gtfsEntry.agency = data.rows[0].agency_name;
				    	  gtfsEntry.startDate = data.rows[0].start_date;
				    	  gtfsEntry.endDate = data.rows[0].end_date;
				    	}else{
				    		gtfsEntry.agency = job.info[0].file.filename;
				    	}
				    	MetaGtfs.create(gtfsEntry)
					    .exec(function(err,newEntry){
					    	if(err){ console.log('metaAcs create error',err);}
								
						    Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Success'})
							.exec(function(err,updated_job){
								if(err){ console.log('job update error',error); }
								sails.sockets.blast('job_updated',updated_job);		
							});
						});

					})
				}
	    	
	    	})
					
		}else{
			Job.update({id:job.id},{isFinished:true,finished:Date(),status:'Failure'})
			.exec(function(err,updated_job){
				if(err){ console.log('job update error',err); }
				sails.sockets.blast('job_updated',updated_job);		
			});
		}
	});

	setTimeout(function() {
	   	
		
        var query = 'CREATE SCHEMA "'+job.info[0].schemaName+'" ';
		MetaGtfs.query(query,{} ,function(err, result) { 
			if(err){ console.log('create schema error',err); }

		    var destinationStream = job.info[0].file.fd;//__dirname + '/cdta_20140811_0109.zip';//+fileInfo.name;
	        console.log("RUNNING:gtfsdb-load --database_url "+conString+" --schema="+job.info[0].schemaName+" --is_geospatial "+destinationStream);
	        terminal.stdin.write("gtfsdb-load --database_url "+conString+" --schema="+job.info[0].schemaName+" --is_geospatial "+destinationStream);        
	    
	        terminal.stdin.end();
		    
		    Job.update({id:job.id},{pid:terminal.pid}).exec(function(err,updated_job){
		    	if(err){ console.log('job update error',error); }
				sails.sockets.blast('job_updated',updated_job);		
		    })

		});

	    
	}, 1000);
}


module.exports = {
	deleteGTFS:function(req,res){

		MetaGtfs.findOne(req.param('id')).exec(function(err,found){
			
			var query = 'DROP SCHEMA "'+found.tableName+'"';
			

			MetaGtfs.query(query,{} ,function(err, result) { 
				if(err) { console.error('error running query:',query, err); }

				MetaGtfs.destroy(found.id).exec(function(err,destroyed){
					if(err) { console.log(err); res.json({error:err}); }

					res.json({'message':'Record '+found.id+' deleted.'})

				});

			});

		});
		
	},
	getRoutes:function(req,res){
		
		MetaGtfs.findOne(req.param('id')).exec(function(err,currentGTFS){
	
			 var sql = 'SELECT route_id, route_short_name, route_long_name FROM '+currentGTFS.tableName+'.routes';
	
		     MetaGtfs.query(sql,{},function(err,data){
		      if (err) {res.send('{status:"error",message:"'+err+'"}',500); return console.log(err);}
	
		      output = data.rows;
		      return res.json(output);
	
		    });
	
		})
	
	},

	upload:function(req,res){


		req.file('files').upload({dirname:'assets/data/gtfs', maxBytes:500000000},
      		function (err, files) {
		      	if (err){

			      	console.log("Error: ",err);
			      	return res.json({message: 'Upload error',files: [] });
	    
	    		}

	    	console.log(files);
	    	var now = new Date();
	    	var schemaName = "gtfs_"+now.getFullYear()+''+now.getMonth()+''+now.getDate()+'_'+now.getHours()+'_'+now.getMinutes();
        
	    	Job.create({
					isFinished:false,
					type:'load GTFS',
					info:[{'file':files[0],'schemaName':schemaName}],
					status:'Started'
				})
				.exec(function(err,job){
					if(err){console.log('create job error',err)
						req.session.flash = {
							err: err
						}
						res.redirect('/data/gtfs');
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
					return res.json({
			
						message: files.length + ' file(s) uploaded successfully!',
				        files: files        
				     
				    });
					
				})

			
   	
		})
	}	
}

