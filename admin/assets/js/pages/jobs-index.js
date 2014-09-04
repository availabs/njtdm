function jobsController($scope) {

	
	$scope.jobs = server_jobs;
	console.log($scope.jobs);
	$scope.current_jobs ={};
	$scope.finished_jobs = {};
	$scope.num_active = 0;
	
	$scope.jobs.forEach(function(job){
		if(job.isFinished){
			$scope.finished_jobs[job.id] = job;
		}else{
			$scope.current_jobs[job.id] = job;
		}
	})

	io.socket.on('connect',function(){

		io.socket.on('job_created', function(data) {
	      ///console.log('jc',data);
	      $scope.current_job[data.id] = data;
	    });

	    io.socket.on('job_updated', function(data) {
	      //console.log('job updated',data,data[0].id,data[0])
	      $scope.current_jobs[data[0].id] = data[0];
	      $scope.$apply();
	    });
	})
   
};