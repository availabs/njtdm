/**
 * UploadsController
 *
 * @description :: Server-side logic for managing uploads
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
// var upload = require('jquery-file-upload-middleware');
// var pg = require('pg');
// var exec = require('child_process').exec

// // configure upload middleware
// console.log(__dirname + '/uploads');
// upload.configure({
//     uploadDir: __dirname + '/uploads',
//     uploadUrl: '/data/gtfs/upload'
// });

// upload.on('error', function (e) {
//     console.log(e.message);
// });

//upload.on('end', function (fileInfo) { 
    //    console.log(fileInfo);
    // var password = 'transit';
    // var conString = "postgres://postgres:"+password+"@lor.availabs.org:5432/njtdmData";
    // var client = new pg.Client(conString);
    // client.connect(function(err) {
    //     if(err) {return console.error('Could not connect to database', err);}
    //     var now = new Date();
    //     var schemaName = "gtfs_"+now.getFullYear()+''+now.getMonth()+''+now.getDate()+'_'+now.getHours()+'_'+now.getMinutes();
    //     client.query('CREATE SCHEMA "'+schemaName+'" ', function(err, result) { 
    //         if(err) { return console.error('error running query:',query, err); } 
    //         var destinationStream = __dirname + '/uploads/'+fileInfo.name;
    //         console.log("RUNNING:gtfsdb-load --database_url "+conString+" --schema="+schemaName+" --is_geospatial "+destinationStream);
    //         child = exec("gtfsdb-load --database_url "+conString+" --schema="+schemaName+" --is_geospatial "+destinationStream,
    //           function (error, stdout, stderr) {
    //             console.log('stdout: ' + stdout);
    //             console.log('stderr: ' + stderr);
    //             if (error !== null) {
    //               console.log('exec error: ' + error);
    //               client.query('DROP SCHEMA "'+schemaName+'" ', function(err, result) { if(err) { return console.error('error running query:',query, err); } })
    //             }
    //         });
    //     })
        
    // });
    
//});

module.exports = {

	gtfsupload:function (req,res) {
            // imageVersions are taken from upload.configure()
            upload.fileHandler({
			    uploadDir: __dirname + '/uploads',
			    uploadUrl: '/data/gtfs/upload'
			})(req,res);
    }
	
};

