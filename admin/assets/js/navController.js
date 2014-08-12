function navController($scope) {

	io.socket.on('connect',function(){
	    io.socket.get('/job',{},function(data){ 
	        console.log('Jobs :',data); 
	    });
	    io.socket.on('Job', function(message){console.log('nav message',message)});
	    io.socket.on('hello', function(data) {
	      console.log('hello',data);
	    });
    })
   
};