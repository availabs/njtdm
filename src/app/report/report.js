var reportMod = angular.module( 'njTDM.report', [
  'ui.state',
  'ui.bootstrap',
  'ui.select2',
  'ngResource'
])
.config(function config( $stateProvider ) {
  $stateProvider.state( 'report', {
    url: '/report',
    views: {
      "main": {
        controller: 'ReportCtrl',
        templateUrl: 'report/report.tpl.html'
      }
    },
    data:{ pageTitle: 'Reporting' }
  });
})

.controller( 'ReportCtrl', function ReportCtrl( $scope,$http,$filter,Scenario,TripTable) {
  
  //-------------------------------------------------------
  // Scope Setup
  ///------------------------------------------------------
  $scope.api = 'http://localhost:1337/';
  $scope.marketAreas = [
    {name:'Atlantic City', id:0},
    {name:'Princeton / Trenton', id:1},
    {name:'Patterson', id:2}
  ];
  $scope.activeMarket = 0;
  $scope.loadedModels = [];
  $scope.loading = false;
  
  //-------------------------------------------------------
  // Interface functions
  //-------------------------------------------------------
  $scope.setActiveMarket = function(id){
    $scope.activeMarket = id;
  };
  
  $scope.isActiveMarket = function(id){
    if($scope.activeMarket === id){ return 'active'; }
    return '';
  };
  
  $scope.loadModelData = function(index){
    $scope.loading = true;

    $http.post($scope.api+'triptable/'+index+'/modeldata')
    .success(function(data){
      var v = -1;
      $scope.finished_models.forEach(function(model,i){
        if(model.id == index){ v = i;}
      });
      console.log(index,v);
      if(v !== -1){
        $scope.loadedModels.push($scope.finished_models[v]);
        $scope.finished_models.splice(v,1);
      }
      $scope.loading=false;
      console.log(data);
      $scope.newData(data);
    });
  };

  $scope.newData = function(data){
    $scope.model_data = modelAnalyst.update_data(data);
        // console.log($scope.model_data);
        // $scope.route_count = $scope.model_data.routes.all();
        // $scope.route_total = 0;
        // $scope.model_data.routes.all().forEach(function(d){
        //   $scope.route_total += d.value;
        // });

        // // get all on_stop objects
        // $scope.on_stops = $scope.model_data.on_stops.all();
        // // sum number of boardings at each stop
        // $scope.on_stops_total = d3.sum($scope.on_stops, function(d) {return d.value;});

        // // get all off_stop objects
        // $scope.off_stops = $scope.model_data.off_stops.all();
        // // sum number of alightings at each stop
        // $scope.off_stops_total = d3.sum($scope.off_stops, function(d) {return d.value;});

        // $scope.transfer_counts = $scope.model_data.transfer_counts.all();

        // $scope.start_time_group = $scope.model_data.start_time_group.all();

        // $scope.model_bad_trips = $scope.model_data.model_bad_trips;

        // $scope.wait_time_group = $scope.model_data.wait_time_group.all();

        // var noWaits = $scope.wait_time_group[0].value,
        //     normWaits = 0,
        //     badWaits = $scope.model_data.model_bad_trips.length,
        //     totalWaits = 0;
        // for (var i = 1; i < $scope.wait_time_group.length; i++) {
        //   normWaits += $scope.wait_time_group[i].value;
        // }
        // totalWaits = noWaits + normWaits + badWaits;
        // //console.log(noWaits, normWaits, badWaits, totalWaits);
        // $scope.wait_time_data = {no_waits: noWaits,
        //                           normal_waits: normWaits,
        //                           bad_waits: badWaits,
        //                           total_waits: totalWaits,
        //                           percent_no_waits: (100*noWaits/totalWaits).toFixed(2),
        //                           percent_norm_waits: (100*normWaits/totalWaits).toFixed(2),
        //                           percent_bad_waits: (100*badWaits/totalWaits).toFixed(2)};

        // gtfsGeo.clearGraphs();
        // gtfsGeo.drawStartTimeGraph($scope.start_time_group);
        // gtfsGeo.drawWaitTimeGraph($scope.wait_time_group.splice(1));
  };

  //$scope.isActiveZone = funtion()  
  $http.get($scope.api+'triptable/finished',{}).success(function(data){
        $scope.finished_models = data;
        console.log(data);
        
  });
});
