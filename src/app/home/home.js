/**
* HOME Module
**/
angular.module( 'njTDM.home', [
  'ui.state',
  'leaflet-directive',
  'ui.bootstrap',
  'ui.select2'
])

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

/**
 * CONTROLLER
 */
.controller( 'HomeCtrl', function HomeController( $scope,$http,leafletData ) {
  $scope.api = 'http://lor.availabs.org:1337/';

  //------------------------------------------
  //Map Setup
  //
  //------------------------------------------
  angular.extend($scope, {
    center: {lat: 39.349667,lng: -74.465093,zoom: 10},
    layers: {baselayers: {mapbox:{name:'mapbox',url:'http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png',type:'xyz'}}},
    events: {map: {enable: ['load','zoomstart', 'drag', 'click', 'mousemove'],logic: 'emit'}}
  });


  //---------------------------------------------
  //Utility Functions Section
  //Top Level Functions
  //---------------------------------------------
  // This will query /accounts and return a promise.
  $scope.loadScenario = function(scenario){
    $scope.map.panTo(new L.LatLng(scenario.center[1], scenario.center[0]));
    $scope.tracts = scenario.tracts;
    censusGeo.scenario_tracts = $scope.tracts;
    console.log('scenario success');
    $http.post($scope.api+'tracts/acs', {tracts:scenario.tracts}).success(function(tract_data){
      $http.post($scope.api+'gtfs/routes', {routes:scenario.routes}).success(function(route_data){
        $scope.loadTripTable(0,scenario.tracts).then(function(trip_table){
          $scope.trip_table = trip_table.data;
          tripTable.update_data(trip_table.data);
          censusData.update_data(tract_data);
          censusGeo.update_scenario();
          gtfsGeo.routeData = route_data.routes;
          //gtfsGeo.drawRoutes();
          
          //two way data binding, lol
          $scope.census_vars = censusData.variables;
          censusData.variables = $scope.census_vars;

          $scope.$watch('tracts', function () {
            $http.post($scope.api+'tracts/acs', {tracts:$scope.tracts}).success(function(data){
              $scope.loadTripTable(0,scenario.tracts).then(function(trip_table){
                $scope.trip_table = trip_table.data;
                tripTable.update_data(trip_table.data);
                censusData.update_data(data);
              });
            });
          }, true);
        });
      });
    });
  };

  $scope.loadTripTable = function(model_type,tracts){
    /*******
    * Model Types
    * 0 - LEHD
    * 1 - AC Survey
    */
    var promise = [];
    if(model_type === 0){
      promise = $http.post($scope.api+'tracts/lehdTrips', {tracts:$scope.tracts}).then(function(data){
        return data;
      });
    }else if(model_type === 1){
      promise = $http.post($scope.api+'tracts/surveyTrips', {tracts:$scope.tracts}).then(function(data){
        return data;
      });
    }
    return promise;
  };
  //----------------------------------------------
  //Get the Map & Go
  //Main Loop
  //----------------------------------------------
  $scope.model_type = 0;
  leafletData.getMap().then(function(map) {
    
    //Grab the Map & Draw all Tracts
    censusGeo.map = map;
    $scope.map = map;
    censusGeo.geodata= njTracts;
    censusGeo.draw();
    gtfsGeo.svg = censusGeo.svg;
    gtfsGeo.init();
    //Get Scenarios & Load the first one
    $http({url:$scope.api+'scenario',method:"GET"}).success(function(data){
      $scope.allScenarios = data;
      $scope.current_template_index = 0;
      $scope.current_template= data[$scope.current_template_index];
      $scope.loadScenario($scope.current_template);
      $scope.$watch('current_template_index', function () {
            $scope.loadScenario($scope.allScenarios[$scope.current_template_index]);
      }, true);
    });
  });
});

/***
**
** Data Analytics Logic
**
******/
tripTable = {
  tt_array : [],
  tt : {},
  update_data:function(trips){
    tripTable.tt = {};
    trips.forEach(function(trip){
      if(trip.from_geoid in tripTable.tt){
        tripTable.tt[trip.from_geoid].outbound_trips +=1;
      }else{
        tripTable.tt[trip.from_geoid] = {'inbound_trips':0,'outbound_trips':1};
      }

      if(trip.to_geoid in tripTable.tt){
        tripTable.tt[trip.to_geoid].inbound_trips +=1;
      }else{
        tripTable.tt[trip.to_geoid] = {'inbound_trips':1,'outbound_trips':0};
      }
    });
  }

};

censusData = {
  acs : {},
  variables:{},
  update_data:function(tracts){
    
    censusData.variables.total_population = 0;
    censusData.variables.employed = 0;
    censusData.variables.unemployed = 0;
    censusData.variables.bus_to_work = 0;
    tracts.forEach(function(tract){
      censusData.acs[tract.geoid] = {};
      censusData.acs[tract.geoid].total_population = tract.b01003_001e;
      censusData.variables.total_population += tract.b01003_001e;

      censusData.acs[tract.geoid].employed = tract.b12006_005e+tract.b12006_010e+tract.b12006_016e+tract.b12006_021e+tract.b12006_027e+tract.b12006_032e+tract.b12006_038e+tract.b12006_043e+tract.b12006_049e+tract.b12006_054e;
      censusData.variables.employed += censusData.acs[tract.geoid].employed;
        
      censusData.acs[tract.geoid].unemployed = tract.b12006_006e+tract.b12006_011e+tract.b12006_017e+tract.b12006_022e+tract.b12006_028e+tract.b12006_033e+tract.b12006_039e+tract.b12006_044e+tract.b12006_050e+tract.b12006_055e;
      censusData.variables.unemployed += censusData.acs[tract.geoid].unemployed;

      censusData.acs[tract.geoid].bus_to_work = tract.b08301_010e;
      censusData.variables.bus_to_work += censusData.acs[tract.geoid].bus_to_work;

    });
  }
};

/**********************************************************************
*
* Draw GTFS
***********************************************************************/
gtfsGeo = {
  routeData:{},
  svg:{},
  g:{},
  init : function() {
     gtfsGeo.g = censusGeo.svg.append("g").attr("class", "leaflet-zoom-hide routes");
  },
  drawRoutes : function(){
    console.log('route_data',topojson.feature(gtfsGeo.routeData, gtfsGeo.routeData.objects.routes));
    var feature=gtfsGeo.g.selectAll("path.route")
      .data(topojson.feature(gtfsGeo.routeData, gtfsGeo.routeData.objects.routes).features)
    .enter().append("path")
      .attr("class", function(d) {
          return "route"; })
      .attr("d", path)
      .attr("stroke",function(d){
        if(typeof d.properties.route_color == 'undefined' || d.properties.route_color === null){
          return "#0f0";
        }else{
          console.log('rc',d.properties.route_color);
          return "#"+d.properties.route_color;
        }
    });
  }
};


/***********************************************************************
*
*
*censusGeo Geography Logic
***********************************************************************/
censusGeo = {
  map : {},
  geodata : {},
  selection : {},
  svg: {},
  g:{},
  feature : {},
  scenario_tracts : [],
  bounds : [],
  choropleth_var: undefined,
  draw:function(){
    var geo = topojson.feature(censusGeo.geodata, censusGeo.geodata.objects.tracts);
    var bounds = d3.geo.bounds(geo);
    path = d3.geo.path().projection(censusGeo.project);

    censusGeo.svg = d3.select(censusGeo.map.getPanes().overlayPane).append("svg");
    censusGeo.g = censusGeo.svg.append("g").attr("class", "leaflet-zoom-hide tracts");
    censusGeo.feature = censusGeo.g.selectAll("path.tract")
      .data(geo.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("class", function(d){
        if(censusGeo.scenario_tracts.indexOf(d.properties.geoid) !== -1){
          return "selected_tract";
        }
        return "tract";
      })
      .on("click",function(d) {
        if (d3.event.ctrlKey) {
          if(d3.select(this).attr('class')=='tract'){
            d3.select(this).attr('class', 'selected_tract');
            censusGeo.scenario_tracts.push(d.properties.geoid);
          }else{
            d3.select(this).attr('class', 'tract');
            var index =censusGeo.scenario_tracts.indexOf(d.properties.geoid);
            if (index > -1) {
              censusGeo.scenario_tracts.splice(index, 1);
            }
          }
        }
      })
      .on("mouseover", function(d){
          if(d3.select(this).attr('class')=='selected_tract'){
            var textTitle = "<p>";
            textTitle += "<strong>Geo ID:</strong>" + d.properties.geoid + "<br>";
            textTitle += "<strong>Population:</strong> "+ number_format(censusData.acs[d.properties.geoid].total_population) +" <br>";
            textTitle += "<strong>Employment:</strong> "+ number_format(censusData.acs[d.properties.geoid].employed) +" <br>";
            textTitle += "<strong>Unemployment:</strong> "+ number_format(censusData.acs[d.properties.geoid].unemployed) +" <br>";
            textTitle += "<strong>Bus to Work:</strong> "+ number_format(censusData.acs[d.properties.geoid].bus_to_work) +" <br>";
            textTitle += "<strong>Trip Table inbound:</strong> "+ number_format(tripTable.tt[d.properties.geoid].inbound_trips) +" <br>";
            textTitle += "<strong>Trip Table outbound:</strong> "+ number_format(tripTable.tt[d.properties.geoid].outbound_trips) +" <br>";
            $("#info").show().html(textTitle);
          }
        })
        .on("mouseout", function(self) {
          $("#info").hide().html("");
        });
      
      
      
      censusGeo.map.on("viewreset", function(){
        censusGeo.reset(bounds,censusGeo.feature);
      });
      censusGeo.reset(bounds,censusGeo.feature);

  },
  choropleth: function(var_name){

  },
  update_scenario:function(){
      censusGeo.g.selectAll("path.tract")
        .transition().duration(1000)
        .attr("class", function(d){
        if(censusGeo.scenario_tracts.indexOf(d.properties.geoid) !== -1){
          return "selected_tract";
        }
        return "tract";
        });

      censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
        .attr("class", function(d){
        if(censusGeo.scenario_tracts.indexOf(d.properties.geoid) !== -1){
          return "selected_tract";
        }
        return "tract";
        });
  },
  project :function(x) {
      if(x.length != 2){ return [];}
      var point = censusGeo.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
      return [point.x, point.y];
  },
  reset :function (bounds,feature) {
     var bottomLeft = censusGeo.project(bounds[0]),
        topRight = censusGeo.project(bounds[1]);
        
        censusGeo.svg.attr("width", topRight[0] - bottomLeft[0])
          .attr("height", bottomLeft[1] - topRight[1])
          .style("margin-left", bottomLeft[0] + "px")
          .style("margin-top", topRight[1] + "px");

        censusGeo.g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
    
    feature
      .attr("d", path)
      .attr("cx", function(d) {
        return censusGeo.project(d.geometry.coordinates)[0];
      })
      .attr("cy", function(d) {
        return censusGeo.project(d.geometry.coordinates)[1];
      });
  }
};
/**********************
** Utils
***********************/
function number_format(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
