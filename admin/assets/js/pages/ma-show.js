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
  	console.log('overview',$scope.marketarea.routes);

  	overviewmap.init("#overview-map-svg", $scope.marketarea.zones, acs_data.acs, overviewmap.draw);

  	$scope.colorMap = function(v) {
  		overviewmap.color(v)
  	}

  	// setTimeout(function() {overviewmap.color('age5_9')}, 2000);

  	//njmap.init('#new-market-svg',$scope.marketarea.routes,$scope.marketarea.zones);

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

		  	nv.utils.windowResize(chart.update);
		})
	  // 	if (vars) {
			// populateTable(vars);
	  // 	}
	}

  	$scope.active_category='Age Categories';

  	$scope.isActive = function(name, vars){
  		if(name === $scope.active_category){
  			return true;
  		}
  		return false;
  	}
  	$scope.drawGraph($scope.active_category, acs_data.categories[$scope.active_category])

	// function populateTable(vars) {
	// 	var rows = d3.select('#overview-table')
	// 		.selectAll('tr')
	// 		.data(vars, function(d) { return acs_data.census_vars[d].name; })

	// 	rows.exit().remove();

	// 	rows.enter().append('tr');

	// 	rows.each(function(d) {
	// 		var row = d3.select(this);

	// 		row.append('td')
	// 			.text(acs_data.census_vars[d].name)

	// 		row.append('td')
	// 			.attr('class', 'text-right')
	// 			.text(acs_data.census_vars[d].value)
	// 	})
	// }
};

function exampleData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var,value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{/*key:"ages",*/values:output}];
}

(function() {
	var overviewmap = {};

	var svg,
		height,
		width;

	var projection,
		path;

	var tractsGeoIDs = [],
		MAtracts = {
		type: "FeatureCollection",
		features: []
	};

	var ACSdata;

	var colorScale = d3.scale.quantize()
		.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

	overviewmap.init = function(svgID, input_tracts, acs_data, callback) {
		tractsGeoIDs = input_tracts;
		ACSdata = acs_data;

		svg = d3.select(svgID);

		height = parseInt(svg.attr('height'));
		width = parseInt(svg.attr('width'));

		projection = d3.geo.albers()
			.translate([width/2, height/2]);

		path = d3.geo.path()
			.projection(projection);

        d3.json('/data/tracts.json', function(error, data) {
            data.features.forEach(function(feat){
                if(input_tracts.indexOf(feat.properties.geoid) !== -1){
                   	MAtracts.features.push(feat);
                }
            })

			callback();
        })

		console.log('finished initializing overview map');
	}

	overviewmap.draw = function() {
		zoomToBounds(MAtracts);

		var group = svg.append('g');

		group.selectAll('path')
			.data(MAtracts.features)
			.enter().append('path')
			.attr('class', 'ma-tract')
			.attr('d', path);
	}

	overviewmap.color = function(category) {
		var domain = [];

		tractsGeoIDs.forEach(function(geoid) {
			domain.push(+ACSdata[geoid][category]);
		})

		colorScale.domain(d3.extent(domain));

		svg.selectAll('path')
			.classed('ma-active', true)
			.style('fill', function(d) {
				return colorScale(ACSdata[d.properties.geoid][category]);
			})
	}

    function zoomToBounds(collection) {
        var bounds = path.bounds(collection),
            wdth = bounds[1][0] - bounds[0][0],
            hght = bounds[1][1] - bounds[0][1],

            k = Math.min(width/wdth, height/hght),
            scale = projection.scale()*k*0.95;

        projection.scale(scale);

        var centroid = path.centroid(collection),
            translate = projection.translate();

        projection.translate([translate[0] - centroid[0] + width / 2,
                             translate[1] - centroid[1] + height / 2]);
    }

	this.overviewmap = overviewmap;
})()