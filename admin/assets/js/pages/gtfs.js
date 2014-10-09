$(function () {
    function pageLoad(){
        'use strict';
        // Initialize the jQuery File Upload widget:
        var $fileupload = $('#fileupload');
        $fileupload.fileupload({
            // Uncomment the following to send cross-domain cookies:
            //xhrFields: {withCredentials: true},
            url: '/gtfs/upload',
            dropZone: $('#dropzone')
        });

        // Enable iframe cross-domain access via redirect option:
        $fileupload.fileupload(
            'option',
            'redirect',
            window.location.href.replace(
                /\/[^\/]*$/,
                '/cors/result.html?%s'
            )
        );
        
    }
    pageLoad();

    PjaxApp.onPageLoad(pageLoad);

});

ngApp.controller('GtfsController',function GtfsController($scope){
    $scope.currentGtfs = '';
    $scope.datasets = {};

    window.datasets.forEach(function(set){
        
        $scope.datasets[set.id] = set;
    
    });

    console.log(datasets);

    $scope.deleteGtfs = function(Gtfs){
        
        $scope.currentGtfs = $scope.datasets[Gtfs];
        
    };

    $scope.removeGtfs = function(id){

    
    
        var url = '/gtfs/delete/'+id;
        
        d3.json(url,function(data){
            
            $('#deleteModal').modal('hide');
            d3.select('#gtfs_'+id).remove();
            console.log(data);
        
        });
    };

});