$(function(){
    function pageLoad(){
       
        //teach select2 to accept data-attributes
        $(".chzn-select").each(function(){
            $(this).select2($(this).data());
        });
        
    }
    pageLoad();
    PjaxApp.onPageLoad(pageLoad);
});


ngApp.controller('ACSController',function ACSController($scope){
	$scope.currentACS = '';
	$scope.datasets = {};

	window.datasets.forEach(function(set){
		
		$scope.datasets[set.id] = set;
	
	});

	console.log(datasets);

	$scope.deleteACS = function(acs){
	 	
	 	$scope.currentACS = $scope.datasets[acs];
	 	
	};

	$scope.removeACS = function(id){

	
	
	 	var url = '/acs/delete/'+id;
	 	
	 	d3.json(url,function(data){
	 		
	 		$('#deleteModal').modal('hide');
	 		d3.select('#acs_'+id).remove();
	 		console.log(data);
	 	
	 	});
	};

});