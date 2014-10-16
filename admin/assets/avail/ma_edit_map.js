(function() {
    var editmap = {};
    
    var map = {},
        marketarea,
        options;

    var countyFeatures = {
      "type": "FeatureCollection",
      "features": []
    },
    marketAreaTracts = {
      "type": "FeatureCollection",
      "features": []
    },
    marketareaRoutes = {};

    var routesLayer,
        tractsLayer;

   

    editmap.init = function(svgID,market_in) {
        marketarea = market_in;        

        var mapquestOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/am3081.h0po4e8k/{z}/{x}/{y}.png");
        
        

        $('#edit_map').height($(window).height() - 100);
        $( window ).resize(function() {
            $('#edit_map').height($(window).height() - 100);
        });
        map = L.map("edit_map", {
          center: [39.8282, -98.5795],
          zoom: 4,
          layers: [mapquestOSM],
          zoomControl: false
        });
        marketarea.counties = marketarea.counties;
        d3.json ('/data/counties.json',function(err,counties){
            topojson.feature(counties, counties.objects.tracts)
            .features.forEach(function(county){
                if(marketarea.counties.indexOf(''+county.properties.geoid) !== -1){
                    countyFeatures.features.push(county);
                }
            }); 
      
            if(countyFeatures.features.length > 0){
                //draw(marketAreaCounties, 'counties','county');
                options = {
                    layerId:'counties',
                    classed:'county',
                    style:{'stroke-dasharray':"5,5"}
                };

                map.addLayer( new L.GeoJSON.d3(countyFeatures,options) );
                map.fitBounds([d3.geo.bounds(countyFeatures)[0].reverse(),d3.geo.bounds(countyFeatures)[1].reverse()]);
            }   
            d3.json('/data/tracts.tjson', function(error, geodata) {
                var data = {};
                Object.keys(geodata.objects).forEach(function(key){
            
                    data = topojson.feature(geodata, geodata.objects[key])
                
                });

                tracts = data;
                tracts.features.forEach(function(feat){
                    if(marketarea.counties.indexOf(feat.properties.geoid.substring(0, 5)) !== -1){
                        marketAreaTracts.features.push(feat);
                    }
                });
                function tractColor(d){
                    if(marketarea.zones.indexOf(d.properties.geoid) != -1){
                        return '#3498db'
                    }
                    return '#fff';
                }
                
                function zoneClick(d){
                    if (d3.event.ctrlKey) {
                        var tract = d3.select(this);
                        if(marketarea.zones.indexOf(d.properties.geoid) === -1){
                           marketarea.zones.push(d.properties.geoid);
                           tract.attr("fill", '#3498db');
                        }else{
                            marketarea.zones.splice(marketarea.zones.indexOf(d.properties.geoid),1);
                            tract.attr("fill", '#fff');
                        }
                    }
                }


                options = {
                    layerId:'census-tracts',
                    classed:'tract',
                    fill:tractColor,
                    onclick:zoneClick,
                    stroke:'#45687F',
                    style:{opacity:0.75},
                    mouseover:{style:{opacity:0.5,fill:'#5DFF3B',cursor:'pointer'}}

                };
                tractsLayer = new L.GeoJSON.d3(marketAreaTracts,options);
                map.addLayer( tractsLayer );

            });
        });


        d3.xhr('/marketarea/'+marketarea.origin_gtfs+'/ma_route_data')
            .response(function(request) {
                return JSON.parse(request.responseText);
            })
            .post(JSON.stringify({ routes: marketarea.routes }), function(error, routes) {
                
                 options = {
                    layerId:'census-tracts',
                    classed:'tract',
                    
                    style:{fill:'none','stroke-width':'4px',stroke:'#45687F'},
                    mouseover:{style:{cursor:'pointer','stroke-width':'6px',stroke:'#4ACC2F'}}

                };
                marketareaRoutes = routes;
                routesLayer = new L.GeoJSON.d3(routes,options)
                map.addLayer( routesLayer );
                //draw(routes, 'routes12','route');
            })
    }

    editmap.getRouteData = function(routeID) {
        var route = '/marketarea/'+marketarea.origin_gtfs+'/'+routeID+'/route_geo';

        d3.json(route, function(error, data) {

          
           marketareaRoutes.features.push(data.features[0]);
           routesLayer.externalUpdate(marketareaRoutes);

        })
    }

    

    
   
    editmap.map = function(){
        return map;
    }

    editmap.removeRoute = function(routeID) {
        
        var spliceIndex = -1;
        marketareaRoutes.features.forEach(function(d,i){
           if(d.properties.short_name == routeID){
                spliceIndex = i;
           }
        })
        
        marketareaRoutes.features.splice(spliceIndex,1);
        routesLayer.externalUpdate(marketareaRoutes);

        marketarea.routes.splice(marketarea.routes.indexOf(routeID),1)
        

        var b = d3.geo.bounds(marketAreaTracts);
        var center = [(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2];

    }
    
    editmap.saveChanges = function(cb){
        d3.json('/marketarea/update/'+marketarea.id)
        .post(JSON.stringify({zones:marketarea.zones,routes:marketarea.routes}),function(err,data){
            if(err){ console.log('err',err);}
            cb(data);
        })
    }

    this.editmap = editmap;
})()