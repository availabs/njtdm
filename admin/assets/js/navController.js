function navController($scope) {

	io.socket.on('connect',function(){
	    io.socket.get('/job',{'where': {"finished":"false"}},function(data){ 
	        console.log('Jobs :',data); 
	    });
	    io.socket.on('job', function(message){console.log('nav message',message)});
	    io.socket.on('hello', function(data) {
	      console.log('hello',data);
	    });
	    io.socket.on('job_created', function(data) {
	      console.log('jc',data);
	    });
    })
   
};