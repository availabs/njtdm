var http = require("http");
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var pg = require('pg'); 
var exec = require('child_process').exec;
var sh = require("execSync")
var util = require('util');
var info = {"good_load":0,"bad_load":0,"no_data":0};
var password="transit";

var options = {
    host: 'www.gtfs-data-exchange.com',
    path: '/api/agencies'
};

http.get(options, function (http_res) {
    //console.log(http_res);
    var data = "";

    http_res.on("data", function (chunk) {
        data += chunk;
    });

    http_res.on("end", function () {
        parseAgencies(JSON.parse(data).data);
    });
})
    .on('error', function(e) {
	console.log(e);
	console.log("Got error: " + e);
    });

var parseAgencies = function(agencyList){
    var validAgencyCount = 0;
    var conString = "postgres://postgres:"+password+"@localhost:5432/gtfs";
    var client = new pg.Client(conString);
    client.connect(function(err) {
	if(err) {
        return console.error('Could not connect to database', err);
	}
     
        //console.log(result.rows[0].theTime);
        //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
        agencyList.forEach(function(agency){
            if(agency['is_official'] && agency['country'] == 'United States'){
                //console.log( agency['dataexchange_id']);
                validAgencyCount++
                var options = {
                    host: 'www.gtfs-data-exchange.com',
                    path: '/api/agency?agency='+agency['dataexchange_id']
                };

                http.get(options, function (http_res) {
                    //console.log(http_res);
                    var data = "";

                    http_res.on("data", function (chunk) {
                        data += chunk;
                    });

                    http_res.on("end", function () {
                        
                        mkdirp(path.resolve(__dirname,"../gtfs/")+"/"+agency['dataexchange_id'], function(err){
                            if (err) console.error(err)
                            //else console.log('created dir '+agency['dataexchange_id']);
                        });
                        if(agency["is_official"] && agency['country'] === 'United States'){
                           //console.log( "Agency id:  " + agency['dataexchange_id'],"File URL:  " + "") 
                        }
                        parseAgent(JSON.parse(data).data,agency,client);
                    });
                })
                    .on('error', function(e) {
			console.log(e);
			console.log("Got error: " + e);
                    });
            }
        })//end for each agency;
        //client.end();
    });
    console.log("Num Agencies:"+validAgencyCount);
    console.log("done");
}



var download = function(url, dest, cb) {
    var file = fs.createWriteStream(dest);
    var request = http.get(url, function(response) {
	response.pipe(file);
	file.on('finish', function() {
	    file.close();
	    cb();
	});
    });
}

var gtfsdbLoad = function(schemaName,destinationStream){
    var result = sh.exec("gtfsdb-load --database_url postgresql://postgres:"+password+"@localhost/gtfs --schema="+schemaName+" --is_geospatial "+destinationStream);
    console.log('return code ' + result.code);
    console.log('stdout + stderr ' + result.stdout);
}

var createSchema = function(client,schemaName){
    var query = 'CREATE SCHEMA "'+schemaName+'" ';
    client.query(query, function(err, result) { if(err) { return console.error('error running query:',query, err); }})
}

var writeAgency = function(agency){
    var body = JSON.stringify(agency);
    var post_options = {
	hostname: "localhost",
	port: 1337,
	path: "/agency/create/",
	method: "POST",
	headers: {
            "Content-Type": "application/json",
            "Content-Length": body.length // Often this part is optional
        }
    }
    var post_req = http.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Response: ' + chunk);
        });
    });
    post_req.write(body);
    post_req.end(); 
}

var inAPI = function(dataexchange_id,cb){
    var options = {
        host: 'localhost',
        port: 1337,
        path: '/agency/?dataexchange_id='+dataexchange_id
    };

    http.get(options, function (http_res) {
        //console.log(http_res);
        var data = "";

        http_res.on("data", function (chunk) {
            data += chunk;
        });

        http_res.on("end", function () {
            output =JSON.parse(data)
            if(output.length > 0){
                cb(true);
            }else{
                cb(false);
            }
        });
    })
	.on('error', function(e) {
	    console.log(e);
	    console.log("Got error: " + e);
	});    
}

var testQuery = function(client,schemaName,agency,destinationStream){
    var query = 'select ST_AsGeoJSON(geom) as geo,route_id from "'+schemaName+'".routes where geom is not null';
    client.query(query, function(err, result) {
	if(err) {
           //return console.error('error running query:',query, err);
            info.no_data++;
            console.log(util.inspect(info,false,null));
           //client.query('DROP SCHEMA "'+schemaName+'"');
            return console.log(schemaName+":No Table");

	}
	if(result.rows && result.rows.length > 0){
            //console.log('error check '+util.inspect(result,false,null)+' '+schemaName);
            if(JSON.parse(result.rows[0].geo) !== null){
                agency['current_datafile'] = schemaName;
                agency.is_official = 1;
                //console.log('Writing '+agency.dataexchange_id)
                //console.log(util.inspect(agency,false,null));
                //writeAgency(agency);
                inAPI(agency.dataexchange_id,function(exists){
                    if(exists){
                        console.log(agency.dataexchange_id+" exists.")
                    }else{
                        console.log(agency.dataexchange_id+" doesn't exist.")
                        writeAgency(agency);
                    }
                });
                //console.log(schemaName+": "+JSON.parse(result.rows[0].geo).coordinates[0][0]);
                info.good_load++;
            }else{
                //client.query('DROP SCHEMA "'+schemaName+'"');
                //console.log(schemaName+": No Geometry");
                info.bad_load++;
                //gtfsdbLoad(schemaName,destinationStream)
            }
        }else{
            //client.query('DROP SCHEMA "'+schemaName+'"');
            //console.log(schemaName+": No Rows");
            info.bad_load++;
            //gtfsdbLoad(schemaName,destinationStream)
        }
        //console.log(util.inspect(info,false,null));
    })
}



var parseAgent = function(agent,agency, client){
    var i = 0;
    var house = agency.dataexchange_id;
    agent.datafiles.forEach(function(datafile){
        if(i == 0){
            var fileNameOrig = agent["datafiles"][0].file_url;
            var nameSplit = fileNameOrig.substr(29);
            var schemaName = fileNameOrig.substr(29).split(".")[0];
            var destinationStream = path.resolve(__dirname,"../gtfs/" + house + "/" + nameSplit);

            testQuery(client,schemaName,agency,destinationStream);
            //createSchema(client,schemaName);
            //gtfsdbLoad(schemaName,destinationStream)
            //download(agent["datafiles"][0].file_url,destinationStream,function(){});
        }
        i++;
    })
    //console.log("agent")
    return agent["datafiles"][0].file_url;
}
