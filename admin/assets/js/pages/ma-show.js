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
  	$scope.marketarea = window.server_marketarea;
  	$scope.routes = [];
  	window.server_routes.forEach(function(route){
  		$scope.routes[route.route_id] = route.route_short_name;
  	});

  	$scope.marketarea.routes = JSON.parse($scope.marketarea.routes);
  	$scope.marketarea.zones = JSON.parse($scope.marketarea.zones);
  	console.log('overview',acs_data);

  	njmap.init('#new-market-svg',$scope.marketarea);
  	overviewmap.init("#overview-map-svg", $scope.marketarea.zones, acs_data.acs, overviewmap.draw);
  	ctppmap.init("#ctpp-svg", $scope.marketarea.zones)

  	$scope.colorMap = function(v) {
  		overviewmap.color(v)
  	}

  	setTimeout(function() {overviewmap.color('age5_9')}, 2000);


  	$scope.active_category='Age Categories';
  	$scope.isActive = function(name){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}
  	// ng-class='isActive'

	$scope.drawGraph = function(name, vars) {
		$scope.active_category= name;

		$scope.current_vars = vars;

		//$scope.apply();

	  	nv.addGraph(function(test){
		  	var chart = nv.models.discreteBarChart()
		      	.x(function(d) { return d.label })    //Specify the data accessors.
		      	.y(function(d) { return d.value })
		      	.staggerLabels(true)    //Too many bars and not enough room? Try staggering labels.
		      	.tooltips(false)        //Don't show tooltips
		      	.showValues(false)       //...instead, show the bar value right on top of each bar.
		      	.transitionDuration(350)
		  
		  	d3.select('#chart svg')
		      	.datum(exampleData(name))
		      	.call(chart);

		    if(exampleData(name)[0].values.length > 10) {
		    	$('.nv-x text').attr('transform','translate(15,20)rotate(45)');
		    }
	  	
		  	nv.utils.windowResize(chart.update);
		})
	}

  	$scope.active_category='Age Categories';

  	$scope.isActive = function(name, vars){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}
  	$scope.drawGraph($scope.active_category, acs_data.categories[$scope.active_category])
};

function exampleData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var.replace(/_/g," "),value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{/*key:"ages",*/values:output}];
}