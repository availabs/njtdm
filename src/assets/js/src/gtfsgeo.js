/**********************************************************************
*
* Draw GTFS
***********************************************************************/
gtfsGeo = {
  routeData:{},
  stopData:{},
  //stops: {},
  g:{},
  init : function() {
     gtfsGeo.g = censusGeo.g;
  },
  drawRoutes : function(){
    var geo = topojson.feature(gtfsGeo.routeData, gtfsGeo.routeData.objects.routes);
    var path = d3.geo.path().projection(gtfsGeo.project);
    console.log(geo);

    var routes = gtfsGeo.g.selectAll("path.route")
                  .data(geo.features);

    routes.enter().append("path")
          .attr("class", "route");

    routes.exit().remove();

    var feature = routes.attr("d", path);

    gtfsGeo.reset(feature, path);
     
    censusGeo.map.on("viewreset", function(){
      gtfsGeo.reset(feature, path);
    });
  },
  vizRoutes: function(inputData){
    var routes = gtfsGeo.g.selectAll("path.route");
    var routeWidth = d3.scale.
    console.log(routes, inputData);
  },
  drawStops: function(){
    // convert the topoJSON to geoJSON
    var geoJSON = topojson.feature(gtfsGeo.stopData, gtfsGeo.stopData.objects.stops);

    var stops = gtfsGeo.g.selectAll("circle.stop")
                    .data(geoJSON.features)

    stops.enter().append("circle")
            .attr("class", "stop")
            .attr("r", "5px")
            .attr("fill", "red");

    stops.exit().remove();

    gtfsGeo.stops_reset(stops);
     
    censusGeo.map.on("viewreset", function(){
      gtfsGeo.stops_reset(stops);
    });
  },
  project:function(x) {
      if(x.length != 2){ return [];}
      var point = censusGeo.map.latLngToLayerPoint(new L.LatLng(x[1]*1, x[0]*1));
      return [point.x, point.y];
  },
  reset:function (feature, path) {
    feature
      .attr("d", path);
  },
  stops_reset: function(stops){
    stops
      .attr("cx", function(d,i){return gtfsGeo.project(d.geometry.coordinates)[0]})
      .attr("cy", function(d){return gtfsGeo.project(d.geometry.coordinates)[1]});
  }
};
