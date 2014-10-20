var terminal = require('child_process').spawn('bash');
var pg = require('pg');

var current_progress = 0;

terminal.stdout.on('data', function (data) {
    data = data+'';
    //console.log("Input:"+data);
    if(data.indexOf('gtfsdb.model') !== -1){
    	console.log('Loading',current_progress++,data.split(" ")[3])
    }
    else{
    	console.log('Unrecognized Output::',data)
    }
});

terminal.on('exit', function (code) {
    console.log('child process exited with code ' + code);
});

setTimeout(function() {
    var password = 'transit';
    var conString = "postgres://postgres:"+password+"@lor.availabs.org:5432/gtfs";
    var client = new pg.Client(conString);
    
    client.connect(function(err) {
        if(err) {return console.error('Could not connect to database', err);}
        
        var now = new Date();
        var schemaName = "gtfs_"+now.getFullYear()+''+now.getMonth()+''+now.getDate()+'_'+now.getHours()+'_'+now.getMinutes();
        
        console.log('schemaName',schemaName);
        client.query('CREATE SCHEMA "'+schemaName+'" ', function(err, result) { 
            if(err) { return console.error('error running query:', err); }

            var destinationStream = __dirname + '/mta-subway-9_19_14.zip';//+fileInfo.name;
            console.log("RUNNING:gtfsdb-load --database_url "+conString+" --schema="+schemaName+" --is_geospatial "+destinationStream);
            console.log('Sending stdin to terminal');
            terminal.stdin.write("gtfsdb-load --database_url "+conString+" --schema="+schemaName+" --is_geospatial "+destinationStream);        
        
            terminal.stdin.end();
        });
        
    });
    
    //console.log('Ending terminal session');

}, 1000);