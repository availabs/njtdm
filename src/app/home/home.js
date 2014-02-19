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
            //"reviews": {'method': 'GET', 'params': {'reviews_only': "true"}, isArray: true}
 
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

/**
 * CONTROLLER
 */
.controller( 'HomeCtrl', function HomeController( $scope,$http,leafletData,$filter,Scenario,TripTable,$modal) {
  $scope.api = 'http://lor.availabs.org:1338/';
  $scope.current_template_index = 0;
  $scope.model_time = 'am';
  $scope.census_vars = censusData.variables;
  $scope.census_categories = censusData.categories;
  $scope.model_type = 'lehd';
  $scope.model_message = '';
  $scope.active_run = false;
  $scope.run_progress = 0;
  $scope.run_max = 100;
  
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
    layers: {baselayers: {}},// {mapbox:{name:'mapbox',url:'http://{s}.tiles.mapbox.com/v3/am3081.map-lkbhqenw/{z}/{x}/{y}.png',type:'xyz'}}},
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
        $scope.loadTripTable($scope.model_type).then(function(trip_table){
          $scope.trip_table = trip_table.data;
          $scope.tt_total = trip_table.data.length;
          tripTable.update_data(trip_table.data);
          //tripTable.draw_trips();
          censusData.update_data(tract_data);
          censusGeo.update_scenario();
          console.log(route_data);
          gtfsGeo.routeData = route_data;
          gtfsGeo.drawRoutes();
          
          //two way data binding, lol
          $scope.census_vars = censusData.variables;
          censusData.variables = $scope.census_vars;
          
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
  };
  
  $scope.newTripTable =function(type){
    $scope.loadTripTable(type,$scope.scenario.tracts).then(function(trip_table){
      $scope.trip_table = trip_table.data;
      tripTable.update_data(trip_table.data);
      censusGeo.choropleth_trip_table('outbound_trips');
    });
  };

  $scope.loadTripTable = function(model_type){
    /*******
    * Model Types
    * 0 - LEHD
    * 1 - AC Survey
    */
    var promise = [];
    if(model_type == 'lehd'){
      promise = $http.post($scope.api+'tracts/lehdTrips', {tracts:$scope.tracts}).then(function(data){
        return data;
      });
    }else if(model_type == 'survey'){
      promise = $http.post($scope.api+'tracts/surveyTrips', {tracts:$scope.tracts}).then(function(data){
        return data;
      });
    }
    return promise;
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
      });
      //Save Scenario And Make it currently selected
      var newScenario = new Scenario({name:model_name,center:$scope.scenario.center,parent:$scope.scenario.id,routes:$scope.scenario.routes,tracts:$scope.scenario.tracts,trip_table_id:newTT.id});
      newScenario.$save();
      $scope.allScenarios.push(newScenario);
      $scope.current_template_index = $scope.allScenarios.length-1;
    }, function () {
      console.log('Modal dismissed at: ' + new Date());
    });

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


  //*************************************************************************************************
  //Get the Map & Go
  //Main Loop
  //
  //----------------------------------------------
  //************************************************************************************************
  
  leafletData.getMap().then(function(map) {
    
    //Grab the Map & Draw all Tracts
    censusGeo.map = map;
    $scope.map = map;
    censusGeo.geodata= njTracts; //loaded in index as seperate file
    censusGeo.draw();
    gtfsGeo.svg = censusGeo.svg;
    gtfsGeo.init();
    tripTable.init();

    //Get Scenarios & Load the first one
      $scope.allScenarios = Scenario.query(function(){
        $scope.current_template= $scope.allScenarios[$scope.current_template_index];
        $scope.loadScenario($scope.current_template);
        $scope.scenario_select= function(index){
          $scope.loadScenario($scope.allScenarios[index]);
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
    if(tripTable.g !== 'unset' && tripTable.tt_array.length >=  0){
      
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
  census_vars:{
  "total_population":{"name":"Population","vars":['b01003_001e'],"value":0},
  "employment":{"name":"employed","vars":['b12006_005e','b12006_010e','b12006_016e','b12006_021e','b12006_027e','b12006_032e','b12006_038e','b12006_043e','b12006_049e','b12006_054e'],"value":0},
  "unemployment":{"name":"Unemployed","vars":['b12006_006e','b12006_011e','b12006_017e','b12006_022e','b12006_028e','b12006_033e','b12006_039e','b12006_044e','b12006_050e','b12006_055e'],"value":0},
  "travel_to_work_total":{"name":"Total","vars":['b08301_001e'],"value":0},
  "car_to_work":{"name":"Car, truck, or van","vars":['b08301_002e'],"value":0},
  "public_transportation_to_work":{"name":"Public transportation","vars":['b08301_010e'],"value":0},
  "bus_to_work":{"name":"Bus","vars":['b08301_010e'],"value":0},
  "total":{"value":0,"vars":['b08126_001e'], "name":"Total:"},
  "agriculture":{"value":0,"vars":['b08126_002e'], "name":"Agriculture, forestry, fishing and hunting, and mining"},
  "construction":{"value":0,"vars":['b08126_003e'], "name":"Construction"},
  "manufacturing":{"value":0,"vars":['b08126_004e'], "name":"Manufacturing"},
  "wholesale":{"value":0,"vars":['b08126_005e'], "name":"Wholesale trade"},
  "retail":{"value":0,"vars":['b08126_006e'], "name":"Retail trade"},
  "transportation":{"value":0,"vars":['b08126_007e'], "name":"Transportation and warehousing, and utilities"},
  "information":{"value":0,"vars":['b08126_008e'], "name":"Information"},
  "finance":{"value":0,"vars":['b08126_009e'], "name":"Finance and insurance, and real estate and rental and leasing"},
  "professional":{"value":0,"vars":['b08126_010e'], "name":"Professional, scientific, and management, and administrative and waste management services"},
  "educational":{"value":0,"vars":['b08126_011e'], "name":"Educational services, and health care and social assistance"},
  "arts":{"value":0,"vars":['b08126_012e'], "name":"Arts, entertainment, and recreation, and accommodation and food services"},
  "other":{"value":0,"vars":['b08126_013e'], "name":"Other services (except public administration)"},
  "public_administration":{"value":0,"vars":['b08126_014e'], "name":"Public administration"},
  "armed_forces":{"value":0,"vars":['b08126_015e'], "name":"Armed forces "}
},
categories : {
  "Population":["total_population"],
  "Employment":["employment","unemployment"],
  "Journey To Work":["travel_to_work_total","bus_to_work","public_transportation_to_work","bus_to_work"],
  "Industry":["total","agriculture","construction","manufacturing","wholesale","retail","transportation","information","finance","professional","educational","arts","other","public_administration","armed_forces"]
},
  update_data:function(tracts){
     
    for (var census_var in censusData.census_vars){
      censusData.census_vars[census_var].value = 0;
    }
    tracts.forEach(function(tract){
      censusData.acs[tract.geoid] = {};
      for (var census_var in censusData.census_vars){
        var value = 0;

        for(var x = 0; x < censusData.census_vars[census_var].vars.length; x++ ){
           //console.log(tract[censusData.census_vars[census_var].vars[x]],censusData.census_vars[census_var].vars[x],x);
           value+=tract[censusData.census_vars[census_var].vars[x]]*1;
        }

        censusData.acs[tract.geoid][census_var] = value;
        censusData.census_vars[census_var].value += censusData.acs[tract.geoid][census_var];
      }
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
    console.log('route data',gtfsGeo.routeData);
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
  brewer_index : 1,
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
            // textTitle += "<strong>Employment:</strong> "+ number_format(censusData.acs[d.properties.geoid].employed) +" <br>";
            // textTitle += "<strong>Unemployment:</strong> "+ number_format(censusData.acs[d.properties.geoid].unemployed) +" <br>";
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
  choropleth_trip_table:function(var_name){
        //console.log('running'+var_name);
        var max=0;
        var min=1000000;
        censusGeo.scenario_tracts.forEach(function(d){
          if(typeof tripTable.tt[d] != 'undefined' ){
            if(tripTable.tt[d][var_name] > max){
              max = tripTable.tt[d][var_name];
            }
            else if(tripTable.tt[d][var_name] < min){
              min = tripTable.tt[d][var_name];
            }
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
            if(typeof tripTable.tt[d.properties.geoid] == 'undefined'){
              return "#0f0";
            }else{
              return censusGeo.color(tripTable.tt[d.properties.geoid][var_name]);
            }

        });
        //viz.setLegend();

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
            if(censusData.acs[d.properties.geoid][var_name] === null){
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
        .style('fill','none')
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

//--------------------------------------------------------------
var ModalInstanceCtrl = function ($scope, $modalInstance) {

  $scope.ok = function (info) {
    $modalInstance.close(info);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
};

/**********************
** Utils
***********************/
function number_format(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
