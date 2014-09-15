function jobsController($scope) {

	
	$scope.jobs = server_jobs;
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

	$scope.cancel_job=function(id){
		//$scope.
	}

	io.socket.on('connect',function(){

		io.socket.on('job_created', function(data) {
	      $scope.current_job[data.id] = data;
	    });

	    io.socket.on('job_updated', function(data) {
	      $scope.current_jobs[data[0].id] = data[0];
	      $scope.$apply();
	    });
	})
   
};