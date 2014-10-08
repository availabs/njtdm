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
    
    $scope.source_id = 1;
    $scope.datasources = {};    
    d3.json('/metaAcs/',function(data){ $scope.datasources['ACS'] = data; });
    d3.json('/metaCtpp/',function(data){ $scope.datasources['CTPP'] = data; });
    d3.json('/metaLodes/',function(data){ $scope.datasources['LODES'] = data; });

    $scope.census_vars = acs_data.census_vars;
  	$scope.census_categories = acs_data.categories;
    $scope.current_map_variable = '';
  	$scope.marketarea = window.server_marketarea;
  	$scope.routes = [];
    $scope.colors = d3.scale.category20().range();
  	window.server_routes.forEach(function(route){
  		$scope.routes[route.route_id] = route.route_short_name;
  	});
    $scope.aboutMap = "About this Map"

  	$scope.marketarea.routes = $scope.marketarea.routes;
  	$scope.marketarea.zones = $scope.marketarea.zones;

  	editmap.init('#new-market-svg',$scope.marketarea);

    $scope.active_category='Vehicles Available';
    $scope.isActive = function(name){
      if(name === $scope.active_category){
        return true;
      }
      return false;
    };

  	acsmap.init("#overview-map-svg", $scope.marketarea.zones, acs_data, function() { acsmap.draw(); acsmap.color(acs_data.categories[$scope.active_category][0], $scope.active_category); });
  	ctppmap.init("#ctpp-svg", $scope.marketarea.zones);
    lodesmap.init("#lodes-svg", $scope.marketarea.zones);

    $scope.colorMap = function(category) {
      $scope.current_map_variable = category;
      acsmap.color(category, $scope.active_category)
    }

  	$scope.removeRoute = function(route){
      editmap.removeRoute(route);
    }
    $scope.saveChanges = function(){
      editmap.saveChanges(function(data){
        console.log('Changes Saved');
      });
    }
    $('#add-route-btn').on('click',function(){
      $('#new-market-error-div').hide();
      console.log('rotue added');

      if($scope.marketarea.routes.indexOf($('#routes-select').val()) === -1){
          editmap.getRouteData($('#gtfs-select').val(), $('#routes-select').val(),function(tracts,center){
              console.log('route returned');
             // $scope.marketarea.zones = tracts;
              //$scope.marketarea.center = center;
              $scope.$apply();
          });
          
          $scope.marketarea.routes.push($('#routes-select').val());
          $scope.$apply();
      }    
    })

    $scope.drawGraph = function(name, vars) {
      acsmap.color(vars[0], name)

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

	$scope.active_category='Vehicles Available';
  
  $scope.isActiveVar = function(invar){
    if(invar === $scope.current_map_variable){
      return 'on';
    }
    return ''
  }

	$scope.isActive = function(name, vars){
		if(name === $scope.active_category){
			return true;
		}
		return false;
	}
	$scope.drawGraph($scope.active_category, acs_data.categories[$scope.active_category])

  $scope.downloadData = function(id){

    //console.log($('#'+id).table2CSV({delivery:'value'}));
    var data = $('#'+id).table2CSV({delivery:'value'});
    var name = $scope.marketarea.name+"_"+$scope.active_category+".csv"
    downloadCSV(data,name)
  
  };


  $scope.current_overview_tab = 'ACS';
  $scope.setActiveOverviewTab = function(tab) {
      return tab === $scope.current_overview_tab;
  }

};

function downloadCSV(output,filename){
    var csvContent = "data:text/csv;charset=utf-8,"+output;
    
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    
    if(link.download !== undefined){
     
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      link.setAttribute('target', '_blank');
      link.click();
    }
    else if(navigator.msSaveBlob) { // IE 10+
      var blob = new Blob([output], {
        "type": "text/csv;charset=utf8;"      
      });
      console.log('IE is downloading!!')
      navigator.msSaveBlob(blob, fileName);
      
      // link.addEventListener("click", function(event) {
      //    console.log('ie is downloading')
        
      // }, false);
      // link.click();
    }
    else{
      console.log('CSV Download not supported')
      var encodedUri = encodeURI(csvContent);
      //window.open(encodedUri);
       $("#downloadCSV")
            .attr({
            'download': filename,
            'href': encodedUri,
            'target': '_blank'
        });
    }
  };

function processCensusData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var.replace(/_/g," "),value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{/*key:"ages",*/values:output}];
}
