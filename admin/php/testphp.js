var terminal = require('child_process').spawn('bash');

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
    console.log('Sending stdin to terminal');
    terminal.stdin.write('php -f loadacs.php lor.availabs.org 5432 njtdmData postgres transit 34 5 10\n');
    
    //console.log('Ending terminal session');
    terminal.stdin.end();
}, 1000);