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
  	console.log('overview',$scope.marketarea);

  	$scope.active_category='Age Categories';
  	$scope.isActive = function(name){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}
  	// ng-class='isActive'
	$scope.drawGraph = function(name, vars) {
		//$scope.active_category= name;

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

		  	nv.utils.windowResize(chart.update);
		})
	  	if (vars)
			populateTable(vars);
	}

  	$scope.active_category='Age Categories';

  	$scope.isActive = function(name, vars){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}
  	$scope.drawGraph($scope.active_category, acs_data.categories[$scope.active_category])

	function populateTable(vars) {
		var rows = d3.select('#overview-table')
			.selectAll('tr')
			.data(vars, function(d) { return acs_data.census_vars[d].name; })

		rows.exit().remove();

		rows.enter().append('tr');

		rows.each(function(d) {
				var row = d3.select(this);

				row.append('td')
					.text(acs_data.census_vars[d].name)

				row.append('td')
					.attr('class', 'text-right')
					.text(acs_data.census_vars[d].value)
			})
	}
};

function exampleData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var,value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{key:"ages",values:output}];
}