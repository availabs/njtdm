function headerController($scope) {

	$scope.current_jobs ={};
	$scope.num_active = 0;
	io.socket.on('connect',function(){
	    io.socket.get('/job',{"where": {"isFinished":false}},function(data){ 
	        //console.log('Jobs :',data.length,data);
	        $scope.current_jobs = {};
	        if(data.length > 0){{}}
	        data.forEach(function(job){
	        	//console.log(job.info);
	        	//job.info = JSON.parse(job.info);
	        	$scope.current_jobs[job.id] = job;
	        	$scope.num_active++;
	        })
	        $scope.$apply(); 
	    });
	    
	    io.socket.on('job', function(message){console.log('nav message',message)});
	    
	    io.socket.on('job_created', function(data) {
	      //console.log('jc',data);
	      $scope.current_job[data.id] = data;
	    });

	    io.socket.on('job_updated', function(data) {
	      //console.log('job updated',data,data[0].id,data[0])
	      $scope.current_jobs[data[0].id] = data[0];
	      $scope.$apply();
	    });
    })
   
};