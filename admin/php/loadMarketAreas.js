var pg = require('pg');

var password = 'transit';
var conString = "postgres://postgres:"+password+"@lor.availabs.org:5432/tdmData";
var client = new pg.Client(conString);
client.connect(function(err) {
    if(err) {return console.error('Could not connect to database', err);}
     client.query("select name,tracts,routes,center from scenario where name like 'Paterson Template'", function(err, result) { 
            if(err) { return console.error('error running query:',query, err); } 
            console.log(result.rows);
            conString = "postgres://postgres:"+password+"@lor.availabs.org:5432/njtdmData";
            var insertClient = new pg.Client(conString);
            insertClient.connect(function(err) {
            	insertClient.query('INSERT INTO marketarea ' +
            		'(name, geounit, zones, routes, center, origin_gtfs, "createdAt", "updatedAt") ' +
            		'VALUES (\'Paterson\', \'tracts\', \''+result.rows[0].tracts+'\', \''+result.rows[0].routes+'\', \''+result.rows[0].center+'\', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            		function(err,insertResult){
            			console.log(err,insertResult)
            		})
            })
            

     })
});