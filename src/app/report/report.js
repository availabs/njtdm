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
  $scope.api = 'http://lor.availabs.org:1338/';
  $scope.colors = colorbrewer.Set1[5];
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
      
      console.log($scope.loadedModels[$scope.loadedModels.length-1].name);
      $scope.newData(data,$scope.loadedModels[$scope.loadedModels.length-1].name);
    });
  };

  $scope.newData = function(data,name){
    
    reportAnalyst.update_data(data,name);
    reportAnalyst.clearGraphs();
    reportAnalyst.renderGraphs();
       
  };

  //$scope.isActiveZone = funtion()  
  $http.get($scope.api+'triptable/finished',{}).success(function(data){
    $scope.finished_models = data;        
  });
});
