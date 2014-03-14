/**
* HOME Module
**/
angular.module( 'njTDM.home', [
  'ui.state',
  'leaflet-directive',
  'ui.bootstrap',
  'ui.select2',
  'ngResource'
])
.filter('startFrom', function() {
  return function(input, start) {
      start = +start; //parse to int
      if(typeof input !== 'undefined'){
         if(typeof input.length !== 'undefined'){
            return input.slice(start);
        }else{
          return [];
        }
      }
      else{
        return [];
      }
  };
})
/**
 *PAGE CONFIG
 */
.config(function config( $stateProvider ) {
  $stateProvider.state( 'home', {
    url: '/',
    views: {
      "main": {
        controller: 'HomeCtrl',
        templateUrl: 'home/home.tpl.html'
      }
    },
    data:{ pageTitle: 'Scenario Editor' }
  });
})
//Services
.factory("Scenario", function ($resource) {
   //var api = 'http://lor.availabs.org:1338/'
    return $resource(
        "http://lor.availabs.org\\:1338/scenario/:id",
        {id: "@id" },
        {
            //custom route
            "templates": {'method': 'GET', 'params': {'where': {'name':null}}},
            'update': { method:'PUT' }
 
        }
    );
})
.factory("TripTable", function ($resource) {
   //var api = 'http://lor.availabs.org:1338/'
    return $resource(
        "http://lor.availabs.org\\:1338/triptable/:id",
        {id: "@id" },
        {
          //custom routes
        }
    );
})
.filter('geoJsonProperties', function(){

  return function(items, input){
    if (!items) {
      return [];
    }
    var arrayToReturn = [];        
    for (var i=0; i<items.length; i++){
        if (items[i].properties.route_short_name.indexOf(input) != -1) {
            arrayToReturn.push(items[i]);
        }
    }

    return arrayToReturn;
  };
})
/**
 * CONTROLLER
 */
.controller( 'HomeCtrl', function HomeController( $scope,$http,leafletData,$filter,Scenario,TripTable,$modal) {
  //$scope.api = 'http://lor.availabs.org:1338/';
  $scope.api = 'http://localhost:1337/';
  $scope.current_template_index = 0;
  $scope.model_time = 'am';
  $scope.census_vars = censusData.variables;
  $scope.census_categories = censusData.categories;
  $scope.model_type = 'lehd';
  $scope.model_message = '';
  $scope.active_run = false;
  $scope.run_progress = 0;
  $scope.run_max = 0;
  $scope.finished_models = [];
  $scope.model_od = 'stops';
  $scope.show_routes = true;
  $scope.show_stops = true;


  /**********************************************
  *
  * Trip Table setup
  ***********************************************/

  $scope.trip_table = [];
  $scope.tt_currentPage = 0;
  $scope.tt_pageSize = 11;
  $scope.tt_total = 0;
  $scope.trips_loaded = false;
  $scope.show_trips = false;
  $scope.tt_search = {};
  $scope.routeFilter = '';
  
  /***************************
  Model Tabs variables

  *****************************/
  $scope.modelTabs = {};
  // to select active model tab
  $scope.modelTabs.active = 'true';

  $scope.updateRoutes = function(value){
    console.log('routefilter changed',value);
    gtfsGeo.routeData = $filter('geoJsonProperties')($scope.route_properties.features,value);
    gtfsGeo.drawRoutes();
  };
/*
  $scope.$watch('routeFilter',
        function(newVal, oldVal) {
          console.log('routefilter changed');
          if (newVal !== oldVal) {
            gtfsGeo.drawRoutes();
          }
        }, true);*/
  
  $scope.$watch('tt_search', function() {
      $scope.tt_total = $filter('filter')($scope.trip_table,$scope.tt_search).length;
      $scope.tt_currentPage = 0;
      tripTable.tt_array=  $filter('filter')($scope.trip_table,$scope.tt_search);
      tripTable.update_trips();
  }, true);
  //------------------------------------------
  //Map Setup
  //
  //------------------------------------------
  angular.extend($scope, {
    center: {lat: 39.349667,lng: -74.465093,zoom: 12},
    layers: {baselayers: {mapbox:{name:'mapbox',url:'http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png',type:'xyz'}}},
    events: {map: {enable: ['load','zoomstart', 'drag', 'click', 'mousemove'],logic: 'emit'}}
  });


  //---------------------------------------------
  //Utility Functions Section
  //Top Level Functions
  //---------------------------------------------
  // This will query /accounts and return a promise.
  $scope.loadScenario = function(scenario){
    $scope.scenario = scenario;
    $scope.map.panTo(new L.LatLng(scenario.center[1], scenario.center[0]));
    $scope.tracts = scenario.tracts;
    censusGeo.scenario_tracts = $scope.tracts;
    $http.post($scope.api+'tracts/acs', {tracts:scenario.tracts}).success(function(tract_data){
      $http.post($scope.api+'gtfs/routes', {routes:scenario.routes}).success(function(route_data){
        $http.post($scope.api+'gtfs/stops', {routes:scenario.routes}).success(function(stop_data){
          $scope.loadTripTable($scope.model_type).then(function(trip_table){
            $scope.trip_table = trip_table.data;
            $scope.tt_total = trip_table.data.length;
            tripTable.update_data(trip_table.data);
            //tripTable.draw_trips();
            censusData.update_data(tract_data);
            censusGeo.update_scenario();

            gtfsGeo.routeData = topojson.feature(route_data, route_data.objects.routes);
            $scope.route_properties = gtfsGeo.routeData;
            // gtfsGeo.routeData.features.forEach(function(d) {
            //   $scope.route_properties.push(d.properties);
            // });

            gtfsGeo.stopData = topojson.feature(stop_data, stop_data.objects.stops);
            $scope.stop_properties = [];
            gtfsGeo.stopData.features.forEach(function(d) {
              $scope.stop_properties.push(d.properties);
            });

            gtfsGeo.drawRoutes();
            gtfsGeo.drawStops();
            
            //two way data binding, lol
            $scope.census_vars = censusData.census_vars;
            censusData.census_vars = $scope.census_vars;
            
            $scope.$watch('tracts', function () {
              $http.post($scope.api+'tracts/acs', {tracts:$scope.tracts}).success(function(data){
                $scope.loadTripTable($scope.model_type).then(function(trip_table){
                  $scope.trip_table = trip_table.data;
                  tripTable.update_data(trip_table.data);
                  censusData.update_data(data);
                  censusGeo.choropleth_trip_table('outbound_trips');
                });
              });
            }, true);
          });
        });
      });
    });
  };

  $scope.tt_choropleth = function(var_name){
    censusGeo.choropleth_trip_table(var_name);
  };

  $scope.mapTripTable =function(){
    if(!$scope.trips_loaded){
      tripTable.draw_trips();
      $scope.trips_loaded = true;
      $scope.show_trips = true;
    }else{
      if($scope.show_trips){
        tripTable.update_trips();
        $('circle.dest').css('display','none');
        $('circle.origin').css('display','none');
        $scope.show_trips = false;
      }else{
         $('circle.dest').css('display','block');
        $('circle.origin').css('display','block');
        $scope.show_trips = true;
      }
    }
  };
  $scope.routes_visible = function(){
 
    if($scope.show_routes){
      $('.route').hide();
      $scope.show_routes = false;
    }else{
      $('.route').show();
      $scope.show_routes = true;
    }

  };

  $scope.stops_visible = function(){
 
    if($scope.show_stops){
      $('.stop').hide();
      $scope.show_stops = false;
    }else{
      $('.stop').show();
      $scope.show_stops = true;
    }

  };

  $scope.newTripTable =function(type){
    $scope.loadTripTable(type,$scope.scenario.tracts).then(function(trip_table){
      $scope.trip_table = trip_table.data;
      tripTable.update_data(trip_table.data);
      if($scope.show_trips){
        tripTable.update_trips();
      }
      censusGeo.choropleth_trip_table('outbound_trips');
      $scope.tt_total = trip_table.data.length;
    });
  };
  $scope.saveScenario = function(){
    Scenario.update({id:$scope.scenario.id },$scope.scenario);
  };

  $scope.route_trips = function(route) {
    $http.post($scope.api+'gtfs/routetrips', {route: route})
          .success(function(data){
            //console.log(data);
            $scope.route_trip_data = data;
          });
  };

  $scope.loadTripTable = function(model_type){
    /*******
    * Model Types
    * 0 - LEHD
    * 1 - LEHD + % Bus
    * 1 - CTPP Bus Trips
    * 1 - AC Survey
    */
    var promise = [];
    if(model_type == 'lehd'){
      promise = $http.post($scope.api+'tracts/lehdTrips', {tracts:$scope.tracts,od:$scope.model_od}).then(function(data){
        return data;
      });
    }
    else if(model_type == 'lehdbus'){
      var busdata = {};
      for(var tract in censusData.acs){
        busdata[tract] = censusData.acs[tract].bus_to_work/censusData.acs[tract].travel_to_work_total;
      }
      promise = $http.post($scope.api+'tracts/lehdTrips', {tracts:$scope.tracts,buspercent:busdata,od:$scope.model_od}).then(function(data){
        return data;
      });
    }
    else if(model_type == 'ctpp'){
      promise = $http.post($scope.api+'tracts/ctppTrips', {tracts:$scope.tracts,od:$scope.model_od}).then(function(data){
        return data;
      });
    }
    else if(model_type == 'survey'){
      promise = $http.post($scope.api+'tracts/surveyTrips', {tracts:$scope.tracts}).then(function(data){
        return data;
      });
    }
    return promise;
  };
  $scope.update_od = function(od){
    $scope.model_od = od;
  };

  //Click On The Run Model Button
  $scope.newModel =function(){

    var modalInstance = $modal.open({
      templateUrl: 'home/partials/new_model.tpl.html',
      controller: ModalInstanceCtrl
    });

    modalInstance.result.then(function (model_name) {
      //Save Trip Table and Start Model Run
      var newTT = new TripTable({trips:$scope.trip_table,model_type:$scope.model_type,model_time:$scope.model_time});
      newTT.$save(function(){
          $http.post($scope.api+'triptable/'+ newTT.id+'/run').success(function(data){
            $scope.active_run = true;
            $scope.getRunStatus(newTT.id);
          });
          var newScenario = new Scenario({name:model_name,center:$scope.scenario.center,parent:$scope.scenario.id,routes:$scope.scenario.routes,tracts:$scope.scenario.tracts,trip_table_id:newTT.id});
          newScenario.$save();
          // $scope.allScenarios.push(newScenario);
          // $scope.current_template_index = $scope.allScenarios.length-1;
      });
      //Save Scenario And Make it currently selected
      
    }, function () {
      //console.log('Modal dismissed at: ' + new Date());
    });

  };

  $scope.vizRoutes = function(){
    gtfsGeo.vizRoutes($scope.model_data.routes.all());
  };

  $scope.vizBoardings = function(name) {
    //var button =
    gtfsGeo.vizBoardings($scope.on_stops);
  };

  $scope.vizAlightings = function(name) {
    gtfsGeo.vizAlightings($scope.off_stops);
  };

  $scope.getRunStatus = function(id){
    $http.post($scope.api+'triptable/'+id+'/status').success(function(data){
      if(data.status == "finished"){
        $scope.active_run = false;
      }else{
        $scope.run_progress = data.runs_processed;
        $scope.run_max = data.total;
        setTimeout(function() { $scope.getRunStatus(id);},3000);
      }
    });
  };

  $scope.choropleth = function(input,divisor){
    if(typeof divisor == 'undefined'){
      censusGeo.choropleth_single(input);
    }else{
      censusGeo.choropleth_percent(input,divisor);
    }
  };
  
  $scope.showOD = function(type){
    //console.log($scope.model_type);
    if(type == 'lehd' || type == 'lehdbus' || type == 'ctpp'){
      return true;
    }
    return false;
  };

  $scope.loadModelData = function(id){
    
    $http.post($scope.api+'triptable/'+id+'/modeldata').success(function(data){
      
        $scope.model_data = modelAnalyst.update_data(data);
        $scope.route_count = $scope.model_data.routes.all();
        $scope.route_total = 0;
        $scope.model_data.routes.all().forEach(function(d){
          $scope.route_total += d.value;
        });

        // get all on_stop objects
        $scope.on_stops = $scope.model_data.on_stops.all();
        // sum number of boardings at each stop
        $scope.on_stops_total = d3.sum($scope.on_stops, function(d) {return d.value;});

        // get all off_stop objects
        $scope.off_stops = $scope.model_data.off_stops.all();
        // sum number of alightings at each stop
        $scope.off_stops_total = d3.sum($scope.off_stops, function(d) {return d.value;});

        $scope.transfer_counts = $scope.model_data.transfer_counts.all();

        $scope.start_time_group = $scope.model_data.start_time_group.all();

        $scope.model_bad_trips = $scope.model_data.model_bad_trips;

        $scope.wait_time_group = $scope.model_data.wait_time_group.all();

        var noWaits = $scope.wait_time_group[0].value,
            normWaits = 0,
            badWaits = $scope.model_data.model_bad_trips.length,
            totalWaits = 0;
        for (var i = 1; i < $scope.wait_time_group.length; i++) {
          normWaits += $scope.wait_time_group[i].value;
        }
        totalWaits = noWaits + normWaits + badWaits;
        //console.log(noWaits, normWaits, badWaits, totalWaits);
        $scope.wait_time_data = {no_waits: noWaits,
                                  normal_waits: normWaits,
                                  bad_waits: badWaits,
                                  total_waits: totalWaits,
                                  percent_no_waits: (100*noWaits/totalWaits).toFixed(2),
                                  percent_norm_waits: (100*normWaits/totalWaits).toFixed(2),
                                  percent_bad_waits: (100*badWaits/totalWaits).toFixed(2)};

        gtfsGeo.clearGraphs();
        gtfsGeo.drawStartTimeGraph($scope.start_time_group);
        gtfsGeo.drawWaitTimeGraph($scope.wait_time_group.splice(1));
    });

  };

  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //Get the Map & Go
  //Main Loop
  leafletData.getMap().then(function(map) {
    
    //Grab the Map & Draw all Tracts
    L.control.scale({position:"bottomleft"}).addTo(map);
    censusGeo.map = map;
    $scope.map = map;
    censusGeo.geodata= njTracts; //loaded in index as seperate file
    censusGeo.draw();
    gtfsGeo.svg = censusGeo.svg;
    gtfsGeo.init();
    tripTable.init();

    //Get Scenarios & Load the first one
      $scope.allScenarios = Scenario.query(function(){
        $scope.current_template= $scope.allScenarios[0];
        $scope.loadScenario($scope.current_template);
        $scope.scenario_select = function(index){
          $scope.loadScenario($scope.allScenarios[index]);
        };
        $http.post($scope.api+'triptable/finished').success(function(data){
          $scope.finished_models = data;
        });
      });
  });
  //************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
  //***************************************************************************************************
})


//--------------------------------------------------------------
.controller( 'ModalInstanceCtrl', function ($scope, $modalInstance) {
  
  $scope.ok = function (info) {
    $modalInstance.close(info);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});
