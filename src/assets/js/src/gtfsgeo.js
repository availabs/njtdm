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

    routes.attr("d", path);

    gtfsGeo.reset(routes, path);
     
    censusGeo.map.on("viewreset", function(){
      gtfsGeo.reset(routes, path);
    });
  },
  vizRoutes: function(inputData){
    var routes = gtfsGeo.g.selectAll("path.route"),
        min = d3.min(inputData, function(d) {return d.value;}),
        max = d3.max(inputData, function(d) {return d.value;}),
        width = d3.scale.linear()
                        .domain([min, max])
                        .range([3, 20]);

    var routeWidth = {};

    inputData.forEach(function(d, i) {
      routeWidth[d.key] = Math.round(width(d.value));
    });

    routes
      .transition()
      .duration(1000)
      .style("stroke-width", function(d){
        //console.log(d);
        return routeWidth[d.properties.route_short_name];
      });
  },
  drawStops: function(){
    // convert the topoJSON to geoJSON
    var geoJSON = topojson.feature(gtfsGeo.stopData, gtfsGeo.stopData.objects.stops);

    var stops = gtfsGeo.g.selectAll("circle.stop")
                    .data(geoJSON.features);

    stops.enter().append("circle")
            .attr("class", "stop")
            .attr("r", "4px")
            .style("fill", '#f00')
            .style("opacity", '0.75');

    stops.exit().remove();

    gtfsGeo.stops_reset(stops);
     
    censusGeo.map.on("viewreset", function(){
      gtfsGeo.stops_reset(stops);
    });
  },
  vizBoardings: function(inputData) {
    var stops = gtfsGeo.g.selectAll("circle.stop"),
        min = d3.min(inputData, function(d) {return d.value;}),
        max = d3.max(inputData, function(d) {return d.value;}),
        radius = d3.scale.linear()
                        .domain([min, max])
                        .range([5, 40]);

    var stopsRadius = {};

    inputData.forEach(function(d, i) {
      stopsRadius[d.key] = Math.round(radius(d.value));
    });

    /*stops.filter(function(d){
      return stopsRadius[d.properties.stop_code];
    });*/

    stops
      .transition()
      .duration(1000)
      .attr("r", function(d){return stopsRadius[d.properties.stop_code] || 0;})
      .style("fill", '#0f0');
  },
  vizAlightings: function(inputData) {
    var stops = gtfsGeo.g.selectAll("circle.stop"),
        min = d3.min(inputData, function(d) {return d.value;}),
        max = d3.max(inputData, function(d) {return d.value;}),
        radius = d3.scale.linear()
                        .domain([min, max])
                        .range([5, 40]);

    var stopsRadius = {};

    inputData.forEach(function(d, i) {
      stopsRadius[d.key] = Math.round(radius(d.value));
    });

    stops.filter(function(d){
      return stopsRadius[d.properties.stop_code];
    });

    stops
      .transition()
      .duration(1000)
      .attr("r", function(d){return stopsRadius[d.properties.stop_code] || 0;})
      .style("fill", '#f00');
  },
  clearGraphs: function() {
    d3.select('#graphDiv').selectAll('svg').remove();
  },
  getDimensions: function() {
    var margin = {top: 10, right: 0, bottom: 20, left: 25},
        width = 330 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;
    return {margin: margin, width: width, height: height};
  },
  drawStartTimeGraph: function(data) {
    var dims = gtfsGeo.getDimensions(),
        margin = dims.margin,
        width = dims.width,
        height = dims.height;

    var timeScale = d3.time.scale()
                      .domain([data[0].key, data[data.length-1].key])
                      .range([0, width]);
    gtfsGeo.drawGraph(data, timeScale);
  },
  drawWaitTimeGraph: function(data) {
    var dims = gtfsGeo.getDimensions(),
        margin = dims.margin,
        width = dims.width,
        height = dims.height;

    var Xmin = d3.min(data, function(d) { return d.key });
        Xmax = d3.max(data, function(d) { return d.key });
    var Xscale = d3.scale.linear()
                    .domain([Xmin, Xmax])
                    .range([0, width]);
    gtfsGeo.drawGraph(data, Xscale);
  },
  drawGraph: function(data, xScale) {
    //console.log('drawModelGraph', data);
    var dims = gtfsGeo.getDimensions(),
        margin = dims.margin,
        width = dims.width,
        height = dims.height;
        
    var max = d3.max(data, function(d) { return d.value; });

    var heightScale = d3.scale.linear()
                  .domain([0, max])
                  .range([height, 0]);

    var barWidth = Math.round(width / data.length);
    var svg = d3.select('#graphDiv').append('svg')
                  .attr('width', width + margin.left + margin.right)
                  .attr('height', height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate("+margin.left+", "+margin.top+")");

    var xAxis = d3.svg.axis()
                  .scale(xScale)
                  .orient('bottom')
                  .ticks(4);

    svg.append('g')
        .attr('transform', 'translate(0, '+height+')')
        .call(xAxis);

    var yAxis = d3.svg.axis()
                  .scale(heightScale)
                  .orient('left')
                  .ticks(10);

    svg.append('g')
        .call(yAxis);

    var bars = svg.selectAll('rect')
                  .data(data);

    bars.exit().remove();
    bars.enter().append('rect');

    bars.attr('height', function(d) { return height - heightScale(d.value); })
        .attr('width', barWidth)
        .attr('x', function(d, i) { return i*barWidth; })
        .attr('y', function(d) { return heightScale(d.value); })
        .attr('stroke-width', 0)
        .attr('fill', '#44bb44');
  },
  drawTransfersGraph: function() {
    return;
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
