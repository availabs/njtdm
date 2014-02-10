/**
* HOME Module
**/
angular.module( 'njTDM.home', [
  'ui.state',
  'leaflet-directive',
  'ui.bootstrap',
  'ui.select2'
  //'ngResource'
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

/**
 * CONTROLLER
 */
.controller( 'HomeCtrl', function HomeController( $scope,$http,leafletData,$filter ) {
  $scope.api = 'http://localhost:1337/';
  $scope.current_template_index = 0;
  /**********************************************
  *
  * Trip Table setup
  ***********************************************/

  $scope.trip_table = [];
  $scope.tt_currentPage = 0;
  $scope.tt_pageSize = 11;
  $scope.tt_total = 0;
  
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
    layers: {baselayers:{}},// {mapbox:{name:'mapbox',url:'http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png',type:'xyz'}}},
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
    $http.post($scope.api+'tracts/acs', {tracts:scenario.tracts}).success(function(tract_data){
      $http.post($scope.api+'gtfs/routes', {routes:scenario.routes}).success(function(route_data){
        $scope.loadTripTable(0,scenario.tracts).then(function(trip_table){
          $scope.trip_table = trip_table.data;
          $scope.tt_total = trip_table.data.length;
          tripTable.update_data(trip_table.data);
          tripTable.draw_trips();
          censusData.update_data(tract_data);
          censusGeo.update_scenario();
          gtfsGeo.routeData = route_data.routes;
          gtfsGeo.drawRoutes();
          
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

  $scope.choropleth = function(input,divisor){
    if(typeof divisor == 'undefined'){
      console.log('single var2');
      censusGeo.choropleth_single(input);

    }else{
      censusGeo.choropleth_percent(input,divisor);
    }
  };


  //*************************************************************************************************
  //Get the Map & Go
  //Main Loop
  //
  //----------------------------------------------
  //************************************************************************************************
  $scope.model_type = 0;
  leafletData.getMap().then(function(map) {
    
    //Grab the Map & Draw all Tracts
    censusGeo.map = map;
    $scope.map = map;
    censusGeo.geodata= njTracts;
    censusGeo.draw();
    gtfsGeo.svg = censusGeo.svg;
    gtfsGeo.init();
    tripTable.init();
    //Get Scenarios & Load the first one
    
    $http({url:$scope.api+'scenario',method:"GET"}).success(function(data){
      $scope.allScenarios = data;
      $scope.current_template= $scope.allScenarios[$scope.current_template_index];
      $scope.loadScenario($scope.current_template);
      $scope.scenario_select= function(){
        $scope.loadScenario($scope.allScenarios[$scope.current_template_index]);
      };
    });
  });
  //***************************************************************************************************
  //**************************************************************************************************
});

/***
**
** Data Analytics Logic
**
******/
tripTable = {
  tt_array : [],
  tt : {},
  svg : {},
  g : 'unset',
  origins : {},
  dests : {},
  init : function() {
     tripTable.g = censusGeo.g;
  },
  update_data:function(trips){
    tripTable.tt = {};
    tripTable.tt_array = trips;
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
  },
  draw_trips : function (){
    //console.log('draw trips',tripTable.tt_array);
    tripTable.g.selectAll("circle.origin").remove();
    tripTable.g.selectAll("circle.dest").remove();

    tripTable.origins = tripTable.g.selectAll("circle.origin")
      .data(tripTable.tt_array)
      .enter()
      .append("circle")
      .attr({
        r: 4,
        cx: function(d,i) {
          return tripTable.project(d.from_coords)[0];
        },
        cy: function(d,i) {
          return tripTable.project(d.from_coords)[1];
        },
        fill:"#000",
        class : function(d,i){
          return 'origin';
        }
      });

    tripTable.dests = tripTable.g.selectAll("circle.dest")
      .data(tripTable.tt_array)
      .enter()
      .append("circle")
      .attr({
        r: 4,
        cx: function(d,i) {
          return tripTable.project(d.to_coords)[0];
        },
        cy: function(d,i) {
          return tripTable.project(d.to_coords)[1];
        },
        fill:"#fff",
        class : function(d,i){
          return 'dest';
        }
      });
      censusGeo.map.on("viewreset", function(){
        tripTable.reset_orig(tripTable.origins);
        tripTable.reset_dest(tripTable.dests);
      });
      tripTable.reset_orig(tripTable.origins);
      tripTable.reset_dest(tripTable.dests);
  },
  project :function(x) {
      if(x.length != 2){ return [];}
      var point = censusGeo.map.latLngToLayerPoint(new L.LatLng(x[0], x[1]));
      return [point.x, point.y];
  },
  update_trips : function(){
    console.log('update trips');
    if(tripTable.g !== 'unset' && tripTable.tt_array.length >=  0){
      console.log(tripTable.tt_array.length);
      
      console.log('test',tripTable.g.selectAll("circle.origin"));
      
      tripTable.origins = tripTable.g.selectAll("circle.origin")
        .data(tripTable.tt_array);

      tripTable.origins
        .enter()
        .append("circle")
        .attr({
            r: 4,
            cx: function(d,i) {
              return tripTable.project(d.from_coords)[0];
            },
            cy: function(d,i) {
              return tripTable.project(d.from_coords)[1];
            },
            fill:"#000",
            class : function(d,i){
              return 'origin';
            }
          });
      
      tripTable.origins
        .exit()
        .remove();

      tripTable.dests = tripTable.g.selectAll("circle.dest")
        .data(tripTable.tt_array);
      
      tripTable.dests
        .enter()
         .append("circle")
         .attr({
              r: 4,
              cx: function(d,i) {
                return tripTable.project(d.to_coords)[0];
              },
              cy: function(d,i) {
                return tripTable.project(d.to_coords)[1];
              },
              fill:"#fff",
              class : function(d,i){
                return 'dest';
              }
            });

        tripTable.dests
          .exit()
          .remove();

        tripTable.reset_orig(tripTable.origins);
        tripTable.reset_dest(tripTable.dests);
      }
      

  },
  reset_orig:function (feature) {
        
    feature
      .attr("cx", function(d) {
          return tripTable.project(d.from_coords)[0];
        })
        .attr("cy", function(d) {
            return tripTable.project(d.from_coords)[1];
        });
      
  },reset_dest:function (feature) {
        
    feature
      .attr("cx", function(d) {
          return tripTable.project(d.to_coords)[0];
        })
        .attr("cy", function(d) {
            return tripTable.project(d.to_coords)[1];
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
    censusData.variables.travel_to_work_total = 0;
    censusData.variables.car_to_work = 0;
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

      censusData.acs[tract.geoid].travel_to_work_total = tract.b08301_001e;
      censusData.variables.travel_to_work_total += censusData.acs[tract.geoid].travel_to_work_total;

      censusData.acs[tract.geoid].car_to_work = tract.b08301_002e;
      censusData.variables.car_to_work += censusData.acs[tract.geoid].car_to_work;
    });
  }
};


/**********************************************************************
*
* Draw GTFS
***********************************************************************/
gtfsGeo = {
  routeData:{},
  g:{},
  init : function() {
     gtfsGeo.g = censusGeo.g;
  },
  drawRoutes : function(){
    var geo = topojson.feature(gtfsGeo.routeData, gtfsGeo.routeData.objects.routes);
    path = d3.geo.path().projection(gtfsGeo.project);
    var bounds = d3.geo.bounds(geo);

    gtfsGeo.g.selectAll("path.route").remove();
    
    var feature=gtfsGeo.g.selectAll("path.route")
      .data(geo.features)
    .enter().append("path")
      .attr("class", function(d) {
          return "route"; })
      .attr("d", path);
     
    censusGeo.map.on("viewreset", function(){
        gtfsGeo.reset(bounds,feature);
      });
      gtfsGeo.reset(bounds,feature);
  },
  project :function(x) {
      if(x.length != 2){ return [];}
      var point = censusGeo.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
      return [point.x, point.y];
  },
  reset :function (bounds,feature) {
        
    feature
      .attr("d", path);
      
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
  legend_domain : {},
  ll:6,
  color:[],
  brewer:['YlGn','YlGnBu','GnBu','BuGn','PuBuGn','PuBu','BuPu','RdPu','PuRd','OrRd','YlOrRd','YlOrBr','Purples','Blues','Greens','Oranges','Reds','Greys','PuOr','BrBG','PRGn','PiYG','RdBu','RdGy','RdYlBu','Spectral','RdYlGn','Accent','Dark2','Paired','Pastel1','Pastel2','Set1','Set2','Set3'],
  brewer_index : 0,
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
            textTitle += "<strong>Bus to Work:</strong> "+ number_format(censusData.acs[d.properties.geoid].bus_to_work) +" ("+ number_format((censusData.acs[d.properties.geoid].bus_to_work/censusData.acs[d.properties.geoid].travel_to_work_total*100).toFixed(2)) +"%) <br>";
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
  choropleth_single:function(var_name){

        var max=0;
        var min=1000000;
        censusGeo.scenario_tracts.forEach(function(d){
          //console.log(f.properties)
          if(censusData.acs[d][var_name] > max){
            max = censusData.acs[d][var_name];
          }
          else if(censusData.acs[d][var_name] < min){
            min = censusData.acs[d][var_name];
          }
        });
        censusGeo.legend_domain = d3.scale.quantile()
          .domain([min,max])
          .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);


        censusGeo.color = d3.scale.quantile()
            .domain(censusGeo.legend_domain.quantiles())
            .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);

        censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
          .style("fill",function(d){
            if(censusData.acs[d.properties.geoid][var_name] == null){
              return "#f00";
            }else{
              return censusGeo.color(censusData.acs[d.properties.geoid][var_name]);
            }

        });
        //viz.setLegend();

  },
  choropleth_percent:function(var_name,divisor){

        var max=0;
        var min=1000000;
        censusGeo.scenario_tracts.forEach(function(d){
          //console.log(f.properties)
          if(censusData.acs[d][var_name]/censusData.acs[d][divisor] > max){
            max = censusData.acs[d][var_name]/censusData.acs[d][divisor];
          }
          else if(censusData.acs[d][var_name]/censusData.acs[d][divisor] < min){
            min = censusData.acs[d][var_name]/censusData.acs[d][divisor];
          }
        });
        censusGeo.legend_domain = d3.scale.quantile()
          .domain([min,max])
          .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);


        censusGeo.color = d3.scale.quantile()
            .domain(censusGeo.legend_domain.quantiles())
            .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);

        censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
          .style("fill",function(d){
            if(censusData.acs[d.properties.geoid][var_name] == null){
              return "#f00";
            }else{
              var data = (censusData.acs[d.properties.geoid][var_name])/(censusData.acs[d.properties.geoid][divisor]);
              return censusGeo.color(data);
            }

        });
        //viz.setLegend();

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
      .attr("d", path);
      
  }
};
/**********************
** Utils
***********************/
function number_format(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
