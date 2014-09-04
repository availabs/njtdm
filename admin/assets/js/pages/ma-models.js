$(function(){
    function pageLoad(){
       
        //teach select2 to accept data-attributes
        $(".chzn-select").each(function(){
            $(this).select2($(this).data());
        });
        
        // $(".iCheck").iCheck({
        //     checkboxClass: 'icheckbox_square-grey',
        //     radioClass: 'iradio_square-grey'
        // });

        
    }
    pageLoad();
    PjaxApp.onPageLoad(pageLoad);
});
function modelPageCtrl($scope){

  $scope.marketarea = window.server_marketarea;
  $scope.datasources = window.server_datasources;
  $scope.active_page ='run';
  $scope.model = {}
  $scope.model.name = '';
  $scope.triptable = {};

  $scope.current_model_run = {
    marketarea:$scope.marketarea,
    type:'regression',
    time:'am',
    od:'bus',
    forecast:'current',
    forecast_type:'mpo',
    forecast_growth:5,
    datasources:{
      acs_source:$scope.datasources.acs[0].tableName,
      lodes_source:$scope.datasources.lodes[0].tableName,
      gtfs_source:$scope.datasources.gtfs[0].tableName,
      ctpp_source:$scope.datasources.ctpp[0].tableName
    }
  };

  triptableMap.init('#triptable-svg',$scope.marketarea);
  d3.json('/triptable')
  .post(JSON.stringify({triptable_settings:$scope.current_model_run}),
  function(err,res){
    if(err){ console.log(err); }
    //console.log(res);
    $scope.triptable = res;
    console.log($scope.triptable)
    triptableMap.updateData(res.tt);
    $scope.$apply();
  });

  $scope.setActivePage = function(val){ $scope.active_page=val; }

  $scope.modelTypes = {
    ///'lehd':"LODES+ACS",
    'ctpp':"CTPP",
    'regression':"Regression",
    //'survey':"Survey"
  }
  $scope.modelTimes = {
    'am':'AM Peak',
    'pm':'PM Peak',
    'full':'Full Day'
  }
  $scope.modelODSources = {
    'bus':'Bus Stops',
    'survey':'Survey OD',
    'parcel':'Parcels'
  }
  $scope.modelForecast = {
    'current':'Current',
    '5year':'Five Year Future Forecast'
    
  }

  

  $scope.forecast_selector = function(val){ if(val == $scope.current_model_run.forecast){ return true; }else{ return false; } };
  $scope.od_selector = function(val){ if(val == $scope.current_model_run.od){ return true; }else{ return false; } };
  $scope.type_selector = function(val){ if(val == $scope.current_model_run.type){ return true; }else{ return false; } };
  $scope.time_selector = function(val){ if(val == $scope.current_model_run.time){ return true; }else{ return false; } };
  $scope.forecast = function(){ if($scope.current_model_run.forecast == '5year'){ return true; }else{return false} };

  $scope.getTripTable = function(){
    d3.json('/triptable')
    .post(JSON.stringify({triptable_settings:$scope.current_model_run}),
    function(err,res){
      if(err){ console.log(err); }
      console.log('new trip table',res);
      triptableMap.updateData(res.tt);
      $scope.triptable = res;
      $scope.$apply();
    });
  };

  $scope.runModel = function(){
    $scope.model.trips = $scope.triptable.tt;
    $scope.model.info = JSON.stringify($scope.current_model_run);
    $scope.model.marketareaId = $scope.marketarea.id;
    
    $('#runModal').modal('hide');
    io.socket.post('/triptable/run',{model:$scope.model},function(err,data){
      
      if(err){console.log('ma models 105:error',err);}
      console.log('run model',data);
    })
  }
}

function ReportCtrl( $scope,$http,$filter) {
  
  //-------------------------------------------------------
  // Scope Setup
  ///------------------------------------------------------
  $scope.marketarea = window.server_marketarea;
  //$scope.api = 'http://localhost:1337/';
  $scope.colors = colorbrewer.Set1[5];

  $scope.routes = [];
  $scope.time = 'am';
  $scope.times = ['am','pm','full day'];

  $scope.loadedData = {0:[],1:[],2:[]};

  
  $scope.loadedModels = [];
  $scope.loading = false;
  
  //-------------------------------------------------------
  // Interface functions
  //-------------------------------------------------------
 
  $scope.setActiveTime = function(id){
    $scope.time = id;
  };
  
  $scope.isActiveTime = function(id){
    if($scope.time === id){ return 'active'; }
    return '';
  };

// declare and initialize route map
  var modelAnalysisRouteMap = avlminimap.Map()
      .width(750)
      .height(500);

  d3.select('#model-analysis-routemap-svg')
      .call(modelAnalysisRouteMap);
  
  var routeLayer = avlminimap.Layer();

  modelAnalysisRouteMap.append(routeLayer);

  $scope.loadModelData = function(){
  	console.log('loading',$('#model_run_select').val())
    var index = $('#model_run_select').val();
    $scope.loading = true;
    var v = -1;
    $scope.finished_models.forEach(function(model,i){
        if(model.id == index){ v = i;}
    });
    if(v !== -1){
      console.log('loading this model',$scope.finished_models[v].ampm);
      d3.json('/triptable/'+index+'/modeldata',
        function(err,data){
        console.log('loadModelData',data);
        $scope.loadedModels.push($scope.finished_models[v]);
        $scope.finished_models.splice(v,1);
        $scope.loading=false;
        $scope.newData(data,$scope.loadedModels[$scope.loadedModels.length-1].name);
      });
    }
  };

  $scope.filterRoute = function(route){
      reportAnalyst.modelRouteStartGroup = reportAnalyst.modelRouteStart.group(function(d){if(d.substring(0,3) == route){ return d;}});
      reportAnalyst.modelTripCountChart      
          .group(reportAnalyst.modelRouteStartGroup)
          
          dc.renderAll();

  // draw a route on route map

      var url = '/marketarea/'+$scope.marketarea.origin_gtfs+'/routes_geo';
      d3.xhr(url)
          .response(function(request) {
              return JSON.parse(request.responseText);
          })
          .post(JSON.stringify({route: [route]}), function(error, data) {
              if (error) {              
                  console.log(error);
                  return;
              }

              modelAnalysisRouteMap.zoomToBounds(data);
              
              routeLayer.data([data])();
          })
  }

  $scope.newData = function(data,name){
    var marketAreas = [7,11,9]; //Market Area template ids in tdmData.scenario
 
<<<<<<< HEAD
    
     d3.json('/data/tracts.json', function(error, geo) {
      tracts = geo;
      var geoData = {
        type: "FeatureCollection",
        features: []
      };
      tracts.features.forEach(function(feat){
          if($scope.marketarea.zones.indexOf(feat.properties.geoid) !== -1){
             geoData.features.push(feat);
          }
      });
=======
console.log($scope.api+'tracts/scenario/'+marketAreas[$scope.activeMarket])    
    d3.json($scope.api+'tracts/scenario/'+marketAreas[$scope.activeMarket],function(err,geoData){
     
>>>>>>> 5de0457ae6c053b19607b58f68a03d6722f40475
      reportAnalyst.geoData = geoData;
      reportAnalyst.update_data(data,name);
      $scope.routes = []
      reportAnalyst.modelRoutesGroup.all().reduce(function(one,two){$scope.routes.push(two.key)});
      console.log($scope.routes);
      $scope.$apply();
      reportAnalyst.clearGraphs();
      reportAnalyst.renderGraphs();
    });
  };

  //$scope.isActiveZone = funtion()  

  d3.json('/triptable/finished/'+$scope.marketarea.id,function(data){
  	//console.log('hola finished',data)
    $scope.finished_models = data;
    console.log('trip tables',data);
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
}