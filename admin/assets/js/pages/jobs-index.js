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
   
};