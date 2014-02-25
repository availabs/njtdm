/**********************************************************************
*
* Draw GTFS
***********************************************************************/
gtfsGeo = {
  routeData:{},
  stopData:{},
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
      gtfsGeo.drawStops();
  },
  drawStops : function(){
    //console.log(gtfsGeo.stopData);
    // convert the topoJSON to geoJSON
    var geoJSON = topojson.feature(gtfsGeo.routeData, gtfsGeo.routeData.objects.routes),
        geoCenter = d3.geo.centroid(geoJSON),
        bounds = path.bounds(geoJSON),
        path = d3.geo.path().projection(gtfsGeo.project);



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
