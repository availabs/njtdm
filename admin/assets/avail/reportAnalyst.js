var numberFormat = d3.format(".0f");

reportAnalyst = {
  data: [],
  modelTrips : [],
  modelBadTrips : [],
  modelRoute : {},
  modelRoutesGroup : {},
  modelOnStop : {},
  modelOnStopGroup : {},
  modelOffStop : {},
  modelOffStopGroup : {},
  modelTripCount : {},
  modelTripCountGroup : {},
  startMinuteDimension : {},
  startTimeGroup : {},
  waitTimeDimension : {},
  transfer_counts : {},
  waitTimeGroup: {},
  modelStartTimeRunGroup: {},
  modelRuns : [],
  dataset : [],
  dateExtent : [],
  geoData: {},
  
  add_data: function(data, name) {
      data = reportAnalyst.update_data(data, name);
      reportAnalyst.data = data;

      reportAnalyst.updateDataset(data);
  },

  remove_data: function(name) {
      var newDataSet = [];

      reportAnalyst.dataset.forEach(function(d) {
            if (d.modelRun != name) {
                newDataSet.push(d);
            }
      })
      reportAnalyst.dataset = newDataSet;

      reportAnalyst.clearGraphs();
      d3.select('#route-count-table').selectAll('*').remove();
      d3.select('#chart-model-trip-count').selectAll('*').remove();
      
      reportAnalyst.modelRuns.splice(reportAnalyst.modelRuns.indexOf(name), 1);

      reportAnalyst.updateDataset([]);
      if (reportAnalyst.dataset.length) {
        reportAnalyst.renderGraphs();
      }
  },

  update_data:function(data,name){
    if(reportAnalyst.modelRuns.indexOf(name) == -1){
      reportAnalyst.modelRuns.push(name);
    }
//console.log('report analysty data',data);
    var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.000Z");
    data.forEach(function(d){
      if(typeof(d.start_time) != 'undefined'){
        d.start_time_d = timeFormat.parse(d.start_time);
        d.timestamp = d.start_time_d.getTime();
        d.minute = d3.time.minute(d.start_time_d);
        d.minute.setHours(d.minute.getHours()-4);
        d.modelRun = name;
        d.durationMinutes = Math.round(d.duration/60000);
        d.waitMinutes = Math.round(d.waiting_time/60);
        d.distance = Math.round((d.distance/1609.34).toFixed(1));
      }else{
         d.start_time_d = new Date();
         d.timestamp = d.start_time_d.getTime();
         d.minute = d3.time.minute(d.start_time_d);
         d.minute.setHours(d.minute.getHours()-4);
         d.modelRun = name;
         d.durationMinutes = 0;
         d.waitMinutes = 0;
         d.distance = 0;
         d.on_tract='';
         d.off_tract='';
      }

    });
    reportAnalyst.dateExtent = d3.extent(data,function(d){return d.start_time_d;});
    reportAnalyst.durationExtent = d3.extent(data,function(d){return d.durationMinutes;});
    reportAnalyst.waitExtent = d3.extent(data,function(d){return d.waitMinutes;});
    reportAnalyst.distanceExtent = d3.extent(data,function(d){return d.distance;});

    return data;

//console.log(data.length);
  },

  updateDataset: function(data) {
    //console.log('update data',data);
    reportAnalyst.modelBadTrips = [];
    // for (var i = data.length-1; i >= 0; i--) {
    //   if (data[i].waiting_time <= 3)
    //     data[i].waiting_time = 0;

    //   if (data[i].waiting_time > 1200) {
    //     reportAnalyst.modelBadTrips.push(data[i]);
    //     data = data.slice(0, i).concat(data.slice(i+1));
    //   }
    // }
    data.forEach(function(d){
        reportAnalyst.dataset.push(d);
    })
console.log(reportAnalyst.dataset.length)
    //console.log('model analyst data', data);
    reportAnalyst.modelTrips = crossfilter(reportAnalyst.dataset);
    
    reportAnalyst.modelRoutes = reportAnalyst.modelTrips.dimension(function(d){return d.route;});
    reportAnalyst.modelRoutesGroup = reportAnalyst.modelRoutes.group();
    reportAnalyst.modelRoutesRunGroup = reportAnalyst.modelRoutes.group().reduce(
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) + 1; return p;},
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) - 1; return p;},
      function () { return {}; }
    );

    // reportAnalyst.modelOnStop = reportAnalyst.modelTrips.dimension(function(d){return d.on_stop_code;});
    // reportAnalyst.modelOnStopGroup = reportAnalyst.modelOnStop.group(function(d) {return d});
    // console.log(3);
    // reportAnalyst.modelOffStop = reportAnalyst.modelTrips.dimension(function(d){return d.off_stop_code;});
    // reportAnalyst.modelOffStopGroup = reportAnalyst.modelOffStop.group();
    // console.log(4);
    // reportAnalyst.modelTripCount= reportAnalyst.modelTrips.dimension(function(d){return d.trip_id;});
    // reportAnalyst.modelTripCountGroup = reportAnalyst.modelTripCount.group();
    // console.log(5); 
    // reportAnalyst.transfer_counts = crossfilter(reportAnalyst.modelTripCountGroup.all())
    //     .dimension(function(d){return d.value-1;}).group();

    reportAnalyst.startMinuteDimension = reportAnalyst.modelTrips.dimension(function(d){return d.minute;}),
    reportAnalyst.startTimeGroup = reportAnalyst.startMinuteDimension.group();
    reportAnalyst.modelStartTimeRunGroup = reportAnalyst.startMinuteDimension.group().reduce(
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) + 1; return p;},
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) - 1; return p;},
      function () { return {}; }
    );
    reportAnalyst.durationMinuteDimension = reportAnalyst.modelTrips.dimension(function(d){return d.durationMinutes;}),
    reportAnalyst.modelDurationRunGroup = reportAnalyst.durationMinuteDimension.group().reduce(
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) + 1; return p;},
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) - 1; return p;},
      function () { return {}; }
    );

    reportAnalyst.waitTimeDimension = reportAnalyst.modelTrips.dimension(function(d){return Math.round(d.waitMinutes);}),
    reportAnalyst.waitTimeGroup = reportAnalyst.waitTimeDimension.group().reduce(
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) + 1; return p;},
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) - 1; return p;},
      function () { return {}; }
    );

    reportAnalyst.distanceDimension = reportAnalyst.modelTrips.dimension(function(d){return d.distance;}),
    reportAnalyst.distanceGroup = reportAnalyst.distanceDimension.group().reduce(
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) + 1; return p;},
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) - 1; return p;},
      function () { return {}; }
    );

    reportAnalyst.modelGeoIDBoarding = reportAnalyst.modelTrips.dimension(function(d){return d.on_tract;});
    reportAnalyst.modelGeoIDBoardingGroup = reportAnalyst.modelGeoIDBoarding.group(function(d){return d;});

    reportAnalyst.modelGeoIDAlighting = reportAnalyst.modelTrips.dimension(function(d){return d.off_tract;});
    reportAnalyst.modelGeoIDAlightingGroup = reportAnalyst.modelGeoIDAlighting.group(function(d){return d;});
    
    reportAnalyst.modelRouteStart = reportAnalyst.modelTrips.dimension(function(d){return d.route+" "+d.trip_start_time;});
    reportAnalyst.modelRouteStartGroup = reportAnalyst.modelRouteStart.group(function(d){return d;});

  },
  clearGraphs: function() {
      d3.select('#myTabContent').selectAll('.graphDiv').selectAll('svg').remove();
      d3.select("#boarding-choropleth").text(null);
      d3.select("#alighting-choropleth").text(null);

      d3.select('#model-analysis-routemap-svg')
          .style('width', '0px')
          .style('height', '0px')
  },

  RoutesTable:function() {
    var routeTable = d3.select('#route-count-table');
    var output = '<table class="table table-striped table-hover"><thead><tr><th>Route ID</th>';
    var totals ={};

    reportAnalyst.modelRuns.forEach(function(runName){
         output += "<th style='text-align:center;'>"+runName+"</th>"
         totals[runName] = 0;
    });
    output+="</tr></thead>"
    reportAnalyst.modelRoutesRunGroup.all().forEach(function(run){
      output += "<tr><td>"+run.key+"</td>"
      reportAnalyst.modelRuns.forEach(function(runName){
         output += "<td style='text-align:center;'>"+run.value[runName]+"</td>"
         if(typeof run.value[runName] != 'undefined'){
          totals[runName]+=run.value[runName];
        }
      })
      output+="</tr>"
    })
    output+="<tfoot><tr><th></th>";
    reportAnalyst.modelRuns.forEach(function(runName){
         output += "<th style='text-align:center;'>"+totals[runName]+"</th>";
    });

    output+="<table>";
    routeTable.html(output);
  },
  RoutesGraph: function() {
     reportAnalyst.routeCountChart = dc.compositeChart("#route-count");
     var width=800,height=400;
     var gap = (width*.9)/(reportAnalyst.modelRoutesRunGroup.all().length*(reportAnalyst.modelRuns.length*2));
     var translate =  (width*.9)/(reportAnalyst.modelRoutesRunGroup.all().length*reportAnalyst.modelRuns.length)-gap;
     var compositer = [];
     var colors = colorbrewer.Set1[5];
     //colors.shift();
     reportAnalyst.modelRuns.forEach(function(run,dex){
        compositer.push(dc.barChart(reportAnalyst.routeCountChart)
          .gap(gap)
          .barPadding(5)
          .outerPadding(25)
          .numGroups(reportAnalyst.modelRuns.length)
          .colors([colors[dex]])
          .ordinalColors([colors[dex]])
          .group(reportAnalyst.modelRoutesRunGroup)
          .title(function (d) {
            return "Route: " + d.key + "\nModel Run: " + d.value[run];
          })
          .valueAccessor(function (d) {
            return d.value[run];
          })
        );
     });
 
    reportAnalyst.routeCountChart
      .width(width)
      .height(height)
      .x(d3.scale.ordinal())
      .xUnits(dc.units.ordinal)
      .dimension(reportAnalyst.modelRoutes)
      .group(reportAnalyst.modelRoutesRunGroup)
      .brushOn(false)
      .transitionDuration(0)
      .xAxisLabel("Route ID")
      .yAxisLabel("# of Riders")
      .compose(compositer)
      .renderlet(function (chart) {
        chart.selectAll("g._1").attr("transform", "translate(" + translate + ", 0)");
        chart.selectAll("g._2").attr("transform", "translate(" + translate*2 + ", 0)");
        chart.selectAll("g._3").attr("transform", "translate(" + translate*3 + ", 0)");
        chart.selectAll("g._4").attr("transform", "translate(" + translate*4 + ", 0)");
        chart.selectAll("g._5").attr("transform", "translate(" + translate*5 + ", 0)");
      });  

  },
  StartTimeGraph: function(){
    var busTripbyStartTimeChart  = dc.barChart("#start-time");
    busTripbyStartTimeChart
      .width(800).height(400)
        .dimension(reportAnalyst.startMinuteDimension)
        .x(d3.time.scale().domain([new Date(2013,6,23, 5,30,0), new Date(2013,6,23, 12,00,0)]))
        .centerBar(true)
        .gap(1)
        .elasticY(true)
        .ordinalColors(colorbrewer.Set1[5])
        .round(d3.time.minute.round)
        .xUnits(d3.time.minutes)
        .xAxisLabel("Trip Departure Time")
        .yAxisLabel("# of Riders")
        .group(reportAnalyst.modelStartTimeRunGroup,reportAnalyst.modelRuns[0])
        .valueAccessor(function (d) {
            return d.value[reportAnalyst.modelRuns[0]];
        })
        if(reportAnalyst.modelRuns.length > 1){
          for(var runIndex = 1; runIndex < reportAnalyst.modelRuns.length; runIndex++){
            busTripbyStartTimeChart.stack(reportAnalyst.modelStartTimeRunGroup, reportAnalyst.modelRuns[runIndex], function (d) {
              return d.value[reportAnalyst.modelRuns[runIndex-1]];
            });
          }
        };
  },
  DurationGraph: function(){
    var tripDurationChart  = dc.barChart("#trip-duration");
    tripDurationChart
      .width(800)
      .height(400)
        .dimension(reportAnalyst.durationMinuteDimension)
        .x(d3.scale.linear().domain(reportAnalyst.durationExtent))
        .centerBar(true)
        .gap(1)
        .elasticY(true)
        .ordinalColors(colorbrewer.Set1[5])
        .xAxisLabel("Trip Duration (minutes)")
        .yAxisLabel("# of Riders")
        .group(reportAnalyst.modelDurationRunGroup,reportAnalyst.modelRuns[0])
        .valueAccessor(function (d) {
            return d.value[reportAnalyst.modelRuns[0]];
        })
        if(reportAnalyst.modelRuns.length > 1){
          for(var runIndex = 1; runIndex < reportAnalyst.modelRuns.length; runIndex++){
            tripDurationChart.stack(reportAnalyst.modelDurationRunGroup, reportAnalyst.modelRuns[runIndex], function (d) {
              return d.value[reportAnalyst.modelRuns[runIndex-1]];
            });
          }
        };
  },
  WaitTimeGraph: function(){
    var waitTimeChart  = dc.barChart("#trip-wait-time");
    waitTimeChart
      .width(800)
      .height(400)
        .dimension(reportAnalyst.waitTimeDimension)
        .x(d3.scale.linear().domain([0,120]))
        .centerBar(true)
        .gap(1)
        .elasticY(true)
        .ordinalColors(colorbrewer.Set1[5])
        .group(reportAnalyst.waitTimeGroup,reportAnalyst.modelRuns[0])
        .xAxisLabel("Trip Wait Time")
        .yAxisLabel("# of Riders")
        .valueAccessor(function (d) {
            return d.value[reportAnalyst.modelRuns[0]];
        })
        if(reportAnalyst.modelRuns.length > 1){
          for(var runIndex = 1; runIndex < reportAnalyst.modelRuns.length; runIndex++){
            waitTimeChart.stack(reportAnalyst.waitTimeGroup, reportAnalyst.modelRuns[runIndex], function (d) {
              return d.value[reportAnalyst.modelRuns[runIndex-1]];
            });
          }
        };
  },
  distanceGraph: function(){
    var distanceChart  = dc.barChart("#trip-distance");
    distanceChart
      .width(800)
      .height(400)
      .dimension(reportAnalyst.distanceDimension)
      .x(d3.scale.linear().domain(reportAnalyst.distanceExtent))
      .centerBar(true)
      .gap(1)
      .elasticY(true)
      .elasticX(true)
      .ordinalColors(colorbrewer.Set1[5])
      .xAxisLabel("Distance Travelled (mi)")
      .yAxisLabel("# of Riders")
      .group(reportAnalyst.distanceGroup,reportAnalyst.modelRuns[0])
      .valueAccessor(function (d) {
            return d.value[reportAnalyst.modelRuns[0]];
      })

      if(reportAnalyst.modelRuns.length > 1){
        for(var runIndex = 1; runIndex < reportAnalyst.modelRuns.length; runIndex++){
          distanceChart.stack(reportAnalyst.distanceGroup, reportAnalyst.modelRuns[runIndex], function (d) {
            return d.value[reportAnalyst.modelRuns[runIndex-1]];
          });
        }
      };
  },
  boardingChoropleth:function(){
      d3.select("#boarding-choropleth").text("Boardings");
      d3.select("#alighting-choropleth").text("Alightings");

      var correctProject = getProjection(770,770,reportAnalyst.geoData);
    
      var censusTractBoarding = dc.geoChoroplethChart("#boarding-choropleth");
      censusTractBoarding
        .width(770)
        .height(770)
        .dimension(reportAnalyst.modelGeoIDBoarding)
        .group(reportAnalyst.modelGeoIDBoardingGroup)
        .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
        .colorDomain([0, 200])
        .colorCalculator(function (d) { return d ? censusTractBoarding.colors()(d) : '#ccc'; })
        .overlayGeoJson(reportAnalyst.geoData.features, "tract", function (d) {
              return d.properties.geoid;
        })
        .projection(correctProject)
        .title(function (d) {
              return "Censust Tract: " + d.key + "\n # Boarding: " + numberFormat(d.value ? d.value : 0);
        });
        censusTractBoarding.legend(dc.legend());

      var censusTractAlighting = dc.geoChoroplethChart("#alighting-choropleth");
      censusTractAlighting
        .width(770)
        .height(770)
        .dimension(reportAnalyst.modelGeoIDAlighting)
        .group(reportAnalyst.modelGeoIDAlightingGroup)
        .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
        .colorDomain([0, 200])
        .colorCalculator(function (d) { return d ? censusTractAlighting.colors()(d) : '#ccc'; })
        .overlayGeoJson(reportAnalyst.geoData.features, "tract", function (d) {
              return d.properties.geoid;
        })
        .projection(correctProject)
        .title(function (d) {
              return "Censust Tract: " + d.key + "\n # Alighting: " + numberFormat(d.value ? d.value : 0);
        });
  },
  tripsGraph: function(){
    reportAnalyst.modelTripCountChart = dc.rowChart("#chart-model-trip-count");
    reportAnalyst.modelRouteStartGroup = reportAnalyst.modelRouteStart.group(function(d){if(d.substring(0,3) == '501'){ return d;}});
    reportAnalyst.modelTripCountChart
      .width(550).height(700)
      .dimension(reportAnalyst.modelRouteStart)
      .group(reportAnalyst.modelRouteStartGroup)
      .elasticX(true);
      //.renderTitleLabel(true);

    
  },
  renderGraphs: function(){
    reportAnalyst.RoutesGraph();
    reportAnalyst.RoutesTable();
    reportAnalyst.StartTimeGraph();
    reportAnalyst.DurationGraph();
    reportAnalyst.WaitTimeGraph();
    reportAnalyst.distanceGraph();
    reportAnalyst.boardingChoropleth();
    reportAnalyst.tripsGraph();
    dc.renderAll();
  },
  showFarebox: function(){
    var farebox = [{"id":"501", "minMax":[192,258,303]},{"id":"502", "minMax":[529,569,647]},{"id":"504", "minMax":[111,138,239]},{"id":"505", "minMax":[936,1154,1309]},{"id":"507", "minMax":[506,647,823]},{"id":"508", "minMax":[378,423,497]},{"id":"509", "minMax":[417,513,543]},{"id":"551", "minMax":[460,505,596]},{"id":"552", "minMax":[405,483,524]},{"id":"553", "minMax":[578,666,846]},{"id":"554", "minMax":[550,592,637]},{"id":"559", "minMax":[273,375,396]}];
    console.log('show farebox',reportAnalyst.routeCountChart);
    
    var boxGroup = reportAnalyst.routeCountChart.svg().select('.stack _0')

    var boxBars = boxGroup.selectAll('fareBar')
    boxGroup
      .data(farebox)
      .enter()
      .append('rect')
      .attr('class','fBar')
      .attr('x',function(d){
        console.log(d);
        return 200;
      })
      .attr('y',200)
      .attr('width',20)
      .attr('height',100)
      .attr('fill','#0f0');


  }
};

function getProjection(width,height,json){
  
  var projection = d3.geo.albers(),
      path = d3.geo.path()
          .projection(projection);

    var bounds = path.bounds(json),
        wdth = bounds[1][0] - bounds[0][0],
        hght = bounds[1][1] - bounds[0][1],

        k = Math.min(width/wdth, height/hght)*.95,
        scale = projection.scale()*k;

    var centroid = [(bounds[1][0]+bounds[0][0])/2, (bounds[1][1]+bounds[0][1])/2]//,
        translate = projection.translate();

    projection.scale(scale)
      .translate([translate[0]*k - centroid[0]*k + width / 2,
                    translate[1]*k - centroid[1]*k + height / 2]);
    // return d3.geo.mercator().center(center).scale(scale).translate(offset);
  return projection;
}