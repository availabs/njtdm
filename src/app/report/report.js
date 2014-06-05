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
  //$scope.api = 'http://lor.availabs.org:1338/';
  //$scope.api = 'http://localhost:1337/';
  $scope.colors = colorbrewer.Set1[5];

  $scope.marketAreas = [
    {name:'Atlantic City', id:0},
    {name:'Princeton / Trenton', id:1},
    {name:'Paterson', id:2}
  ];
  $scope.time = 'am';
  $scope.times = ['am','pm','full day'];

  $scope.loadedData = {0:[],1:[],2:[]};

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

  $scope.setActiveTime = function(id){
    $scope.time = id;
  };
  
  $scope.isActiveTime = function(id){
    if($scope.time === id){ return 'active'; }
    return '';
  };
  
  $scope.loadModelData = function(index){
    $scope.loading = true;
    var v = -1;
    $scope.finished_models.forEach(function(model,i){
        if(model.id == index){ v = i;}
    });
    if(v !== -1){
      console.log('loading this model',$scope.finished_models[v].ampm);
      $http.post($scope.api+'triptable/'+index+'/modeldata',{'ampm':$scope.finished_models[v].ampm})
      .success(function(data){
       
        $scope.loadedModels.push($scope.finished_models[v]);
        $scope.finished_models.splice(v,1);
        $scope.loading=false;
        $scope.newData(data,$scope.loadedModels[$scope.loadedModels.length-1].name);
      });
    }
  };

  $scope.newData = function(data,name){
    var marketAreas = [7,11,9]; //Market Area template ids in tdmData.scenario
 
    var api = 'http://localhost:1337';
    d3.json(api+'/tracts/scenario/'+marketAreas[$scope.activeMarket],function(err,geoData){
     
      reportAnalyst.geoData = geoData;
      reportAnalyst.update_data(data,name);
      reportAnalyst.clearGraphs();
      reportAnalyst.renderGraphs();
    });
  };

  //$scope.isActiveZone = funtion()  
  $http.get($scope.api+'triptable/finished',{}).success(function(data){
    $scope.finished_models = data;
    $scope.finished_models.push({id: 'acam', marketArea: 0,name:"AC AM Farebox",ampm:'am'});
    $scope.finished_models.push({id: 'acammin', marketArea: 0,name:"AC AM Farebox Min",ampm:'am'});
    $scope.finished_models.push({id: 'acammax', marketArea: 0,name:"AC AM Farebox Max",ampm:'am'});
    $scope.finished_models.push({id: 'acpm', marketArea: 0,name:"AC PM Farebox",ampm:'pm'});
    $scope.finished_models.push({id: 'acpmmin', marketArea: 0,name:"AC PM Farebox Min",ampm:'pm'});
    $scope.finished_models.push({id: 'acpmmax', marketArea: 0,name:"AC PM Farebox Max",ampm:'pm'});
    $scope.finished_models.push({id: 'princeam', marketArea: 1,name:"Princeton/Trenton AM Farebox",ampm:'am'});
    $scope.finished_models.push({id: 'princeammin', marketArea: 1,name:"Princeton/Trenton AM Farebox Min",ampm:'am'});
    $scope.finished_models.push({id: 'princeammax', marketArea: 1,name:"Princeton/Trenton AM Farebox Max",ampm:'am'});
    $scope.finished_models.push({id: 'princepm', marketArea: 1,name:"Princeton/Trenton PM Farebox",ampm:'pm'});
    $scope.finished_models.push({id: 'princepmmin', marketArea: 1,name:"Princeton/Trenton PM Farebox Min",ampm:'pm'});
    $scope.finished_models.push({id: 'princepmmax', marketArea: 1,name:"Princeton/Trenton PM Farebox Max",ampm:'pm'});
  });
});
