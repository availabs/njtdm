function headerController($scope) {

	$scope.current_jobs =[];
	io.socket.on('connect',function(){
	    io.socket.get('/job',{"where": {"isFinished":false}},function(data){ 
	        console.log('Jobs :',data.length);
	        $scope.current_jobs = data;
	        $scope.$apply(); 
	    });
	    
	    io.socket.on('job', function(message){console.log('nav message',message)});
	    
	    io.socket.on('job_created', function(data) {
	      console.log('jc',data);
	    });
    })
   
};