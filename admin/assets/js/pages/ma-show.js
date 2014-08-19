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

function OverviewController ($scope) {
    $scope.census_vars = acs_data.census_vars;
  	$scope.census_categories = acs_data.categories;
    $scope.current_map_variable = 
  	$scope.marketarea = window.server_marketarea;
  	$scope.routes = [];
  	window.server_routes.forEach(function(route){
  		$scope.routes[route.route_id] = route.route_short_name;
  	});

  	$scope.marketarea.routes = JSON.parse($scope.marketarea.routes);
  	$scope.marketarea.zones = JSON.parse($scope.marketarea.zones);
  	console.log('overview',acs_data);

  	//njmap.init('#new-market-svg',$scope.marketarea);
  	overviewmap.init("#overview-map-svg", $scope.marketarea.zones, acs_data.acs, function() { overviewmap.draw(); overviewmap.color('total_population'); });
  	ctppmap.init("#ctpp-svg", $scope.marketarea.zones)

  	$scope.colorMap = function(category) {
  		overviewmap.color(category)
  	}

  	$scope.active_category='Population';
  	$scope.isActive = function(name){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}

	$scope.drawGraph = function(name, vars) {
		$scope.active_category= name;

		$scope.current_vars = vars;

		$scope.current_total = 0;
    $scope.current_percent_total = 0;
    
    $scope.current_vars.forEach(function(part){
      if(isNaN($scope.census_vars[part].value)){
        $scope.census_vars[part].value = 0;
      }
      $scope.current_total += $scope.census_vars[part].value;
    });

    $scope.current_vars.forEach(function(part){
      $scope.census_vars[part].percent = ($scope.census_vars[part].value/$scope.current_total*100).toFixed(2);
      $scope.current_percent_total += $scope.census_vars[part].percent*1;
    });

	  nv.addGraph(function(test){
		  	var chart = nv.models.discreteBarChart()
		      	.x(function(d) { return d.label })    //Specify the data accessors.
		      	.y(function(d) { return d.value })
		      	.staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
		      	.tooltips(false)        //Don't show tooltips
		      	.showValues(false)       //...instead, show the bar value right on top of each bar.
		      	.transitionDuration(350)
		  
		  	d3.select('#chart svg')
		      	.datum(processCensusData(name))
		      	.call(chart);

		    if(processCensusData(name)[0].values.length > 10) {
		    	$('.nv-x text').attr('transform','translate(15,20)rotate(45)');
		    }
	  	
		  	nv.utils.windowResize(chart.update);
		})
	}

	$scope.active_category='Population';

	$scope.isActive = function(name, vars){
		if(name === $scope.active_category){
			return true;
		}
		return false;
	}
	$scope.drawGraph($scope.active_category, acs_data.categories[$scope.active_category])

  $scope.downloadData = function(id){

    console.log($('#'+id).table2CSV({delivery:'value'}));;
  };


    $scope.current_overview_tab = 'ACS';

    $scope.setActiveOverviewTab = function(tab) {
        return tab === $scope.current_overview_tab;
    }
};

function processCensusData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var.replace(/_/g," "),value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{/*key:"ages",*/values:output}];
}
