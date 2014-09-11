var terminal = require('child_process').spawn('bash');
var pg = require('pg');

var current_progress = 0;
terminal.stdout.on('data', function (data) {
    data = data+'';
    //console.log("Input:"+data);
    if(data.indexOf('tableName') !== -1){
    	console.log('table-name',data.split(":")[1])
    }
    else if(data.indexOf('status') !== -1){
    	console.log('status',data.split(":")[1])
    	current_progress =0;
    }
    else if(data.indexOf('progress') !== -1){

    	if(data.split(":")[1] !== current_progress){
    		current_progress = data.split(":")[1]
    		console.log(current_progress);
    	}
    }
    else{
    	console.log('error probably',data)
    }
});

terminal.on('exit', function (code) {
    console.log('child process exited with code ' + code);
});

setTimeout(function() {
    var password = 'transit';
    var conString = "postgres://postgres:"+password+"@lor.availabs.org:5432/njtdmData";
    var client = new pg.Client(conString);
    client.connect(function(err) {
        if(err) {return console.error('Could not connect to database', err);}
        var now = new Date();
        var schemaName = "gtfs_"+now.getFullYear()+''+now.getMonth()+''+now.getDate()+'_'+now.getHours()+'_'+now.getMinutes();
        client.query('CREATE SCHEMA "'+schemaName+'" ', function(err, result) { 
            if(err) { return console.error('error running query:',query, err); } 
            var destinationStream = __dirname + '/php/'+fileInfo.name;
            console.log("RUNNING:gtfsdb-load --database_url "+conString+" --schema="+schemaName+" --is_geospatial "+destinationStream);
            console.log('Sending stdin to terminal');
            terminal.stdin.write("gtfsdb-load --database_url "+conString+" --schema="+schemaName+" --is_geospatial "+destinationStream);        
        

        });
        
    });
    
    
    //console.log('Ending terminal session');
    terminal.stdin.end();
}, 1000);