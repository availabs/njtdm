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

  	$scope.active_category='Age Categories';
  	$scope.isActive = function(name){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}
  	// ng-class='isActive'
	$scope.drawGraph = function(name) {
		console.log(name)
		$scope.active_category= name;
	  	// for(key in acs_data.categories){
	  	// 	//console.log(acs_data.categories[key])
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
			  
			  // return chart;
		// 	});
		})
	}
  	$scope.active_category='Age Categories';
  	$scope.isActive = function(name){
  		if(name === $scope.active_category){
  			$scope.drawGraph(name)
  			return true;
  		}
  		return false;
  	}
};

function exampleData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var,value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{key:"ages",values:output}];
}