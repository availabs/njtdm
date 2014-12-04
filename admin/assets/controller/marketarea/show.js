$(function(){
    function pageLoad(){
       
        //teach select2 to accept data-attributes
        $(".chzn-select").each(function(){
            //$(this).select2($(this).data());
        });
        
    }
    pageLoad();
    //PjaxApp.onPageLoad(pageLoad);
});

function OverviewController ($scope) {
    
    $scope.source_id = 'acs5_34_2010_tracts';
    
    $scope.current_overview_tab = 'ACS';
    $scope.jsonData = {
        type: "FeatureCollection",
        crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: []
    };
  

    $scope.datasources = {};    
    d3.json('/metaAcs/',function(data){ $scope.datasources['ACS'] = data; 
      $scope.updateJsonData();

    });
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

  	// $scope.marketarea.routes = $scope.marketarea.routes;
  	// $scope.marketarea.zones = $scope.marketarea.zones;

  	$scope.isActiveDatasource = function(input){
      if(input === $scope.source_id){
        return true;
      }
      return false;
    }

    $scope.$watch('source_id',function(){
      console.log('source changed',$scope.source_id);
    
      if( $scope.current_overview_tab === 'ACS'){
        
        var url = '/marketarea/'+$scope.marketarea.id+'/census/'+$scope.source_id;
        console.log(url);

        d3.json('/marketarea/'+$scope.marketarea.id+'/census/'+$scope.source_id,function(cenData){
          console.log(cenData);
          acs_data.update_data(cenData.census);
          
          //console.log(acs_data.acs,acs_data.census_vars )
          $scope.updateJsonData();

        });
      
      }
    
    });
    $scope.updateJsonData = function(){
      console.log('updateJson',$scope.census_vars)
      $scope.jsonData = {
        type: "FeatureCollection",
        crs: { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        features: []
      };

      $scope.marketarea.geoData.features.forEach(function(feature){
        var temp = feature.properties;
        feature.properties = {};

        
        feature.properties.geoid = temp.geoid
        for(key in $scope.census_vars){
          feature.properties[key] = 0;
           feature.properties[key] += acs_data.acs[temp.geoid][key];
        
        }
        
        feature.properties.emp_den = feature.properties.employment / (feature.properties.aland*0.000000386102159);
        feature.properties.pop_den = feature.properties.total_population / (feature.properties.aland*0.000000386102159);
        $scope.jsonData.features.push(feature);
 
      });
      console.log('json data updatated',$scope.jsonData.features.length)
      
    };//end update JSON data


    $scope.active_category='Vehicles Available';
    $scope.isActive = function(name){
      if(name === $scope.active_category){
        return true;
      }
      return false;
    };


    $scope.marketarea.geoData = { type:"FeatureCollection",features:[] };
    $scope.marketarea.tractFeatures = {};
    d3.json('/data/tracts.tjson', function(error, geodata) {
      var tractData = {};
      Object.keys(geodata.objects).forEach(function(key){
        tractData = topojson.feature(geodata, geodata.objects[key])
      });
      
      tractData.features.forEach(function(feat){
          if($scope.marketarea.zones.indexOf(feat.properties.geoid) !== -1){
              $scope.marketarea.geoData.features.push(feat);
              $scope.marketarea.tractFeatures[feat.properties.geoid] = feat;
          }
      })
      
      ctppmap.init("#ctpp-svg", $scope.marketarea);
      lodesmap.init("#lodes-svg", $scope.marketarea);
      
      $scope.drawGraph($scope.active_category, acs_data.categories[$scope.active_category]);

    })

    var editLoaded = false;
    $scope.$watch('current_overview_tab',function(){
      if($scope.current_overview_tab == 'EDIT' && !editLoaded){
        
        editmap.init('map',$scope.marketarea);
        editLoaded = true;
        L.Util.requestAnimFrame(editmap.map().invalidateSize,editmap.map(),!1,editmap.map()._container);
        
      }
    })
    var acsLoaded = false
  	$scope.refreshMap = function(){
      
      if(!acsLoaded){
        acsmap.init("#overview-map-svg", $scope.marketarea, acs_data, function() { 
          
          L.Util.requestAnimFrame(acsmap.map().invalidateSize,acsmap.map(),!1,acsmap.map()._container);
          acsLoaded = true;
          acsmap.color(acs_data.categories[$scope.active_category][0], $scope.active_category); 
          
          setTimeout(function(){
            acsmap.map().fitBounds([d3.geo.bounds($scope.marketarea.geoData)[0].reverse(),d3.geo.bounds($scope.marketarea.geoData)[1].reverse()]);
          },10)
          
        });
        
     }
    }

    $scope.colorMap = function(category) {
      $scope.current_map_variable = category;
      acsmap.color(category, $scope.active_category)
    }

  	$scope.removeRoute = function(route){
      editmap.removeRoute(route);
      
    }

    $scope.saveChanges = function(){
      editmap.saveChanges(function(data){
        ///console.log('Changes Saved');
      });
    }
    $('#add-route-btn').on('click',function(){
      
      console.log('add route,',$('#routes-select').val())
      if($scope.marketarea.routes.indexOf($('#routes-select').val()) === -1){
          
          editmap.getRouteData($('#routes-select').val());
          
          $scope.marketarea.routes.push($('#routes-select').val());
          
          $scope.$apply();
      }    
    })

    $scope.drawGraph = function(name, vars) {
      if(acsLoaded){
        acsmap.color(vars[0], name)
      }

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
	

  $scope.downloadData = function(id){

    //console.log($('#'+id).table2CSV({delivery:'value'}));
    var data = $('#'+id).table2CSV({delivery:'value'});
    var name = $scope.marketarea.name+"_"+$scope.active_category+".csv"
    downloadFile("data:text/csv;charset=utf-8,",data,name,"#downloadCSV")
  
  };


  $scope.setActiveOverviewTab = function(tab) {
      return tab === $scope.current_overview_tab;
  }
  
  $scope.downloadShape = function(type){
    console.log($scope.jsonData);
    // if($scope.jsonData.features.length == 0){
    //   $scope.updateJsonData();
    // }    
    var output = $scope.jsonData;

    if(type == 'shape'){
      var geoData = {zones:$scope.marketarea.zones,outputName:$scope.source_id,name:$scope.marketarea.name};
      console.log('shape download',geoData);
      d3.xhr('/jsonToShp')
        .post(JSON.stringify({geoData:geoData}),function(err,data){
          if(err){ console.log('err',err); }
          console.log('got shapefile',JSON.parse(data.response).url,$('#downloadShp'));
          //downloadShp
          $('#downloadShp')
           .attr({
            'download': $scope.marketarea.name+"_"+$scope.source_id+".zip",
            'href': JSON.parse(data.response).url,
            'target': '_blank'
          });
          $('#downloadShp')[0].click();


      });
     
      

    
    }else{

      downloadFile("data:text/json;charset=utf-8,",JSON.stringify(output),$scope.marketarea.name+".geojson","#downloadGeo");  
    
    }
    
  }

};//end of controller



function downloadFile(type,output,filename,elem){
    var csvContent = type+output;
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    
    if(link.download !== undefined){
      console.log('download')
      link.setAttribute("href", type+output);
      link.setAttribute("download", filename);
      link.setAttribute('target', '_blank');
      link.click();
    }
    else if(navigator.msSaveBlob) { // IE 10+
      var blob = new Blob([output], {
        "type": "text/csv;charset=utf8;"      
      });
      navigator.msSaveBlob(blob, filename);
    }
    else{
      console.log('none')
      var encodedUri = encodeURI(csvContent);
      //window.open(encodedUri);
       $(elem)
            .attr({
            'download': filename,
            'href': encodedUri,
            'target': '_blank'
        });
        $(elem).click();
    }

  };

function processCensusData(name) {
	var output = [];
	acs_data.categories[name].forEach(function(cen_var){
		output.push({label:cen_var.replace(/_/g," "),value:parseInt(acs_data.census_vars[cen_var].value)});
	});
	return [{/*key:"ages",*/values:output}];
}
