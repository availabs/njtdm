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
  update_data:function(data,name){
    if(reportAnalyst.modelRuns.indexOf(name) == -1){
      reportAnalyst.modelRuns.push(name);
    }
    var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.000Z");
    data.forEach(function(d){

      d.start_time_d = timeFormat.parse(d.start_time);
      d.timestamp = d.start_time_d.getTime();
      d.minute = d3.time.minute(d.start_time_d);
      d.minute.setHours(d.minute.getHours()-4);
      d.modelRun = name;
      d.durationMinutes = Math.round(d.duration/60000);
      d.waitMinutes = Math.round(d.waiting_time/60);
      d.distance = Math.round((d.distance/1609.34).toFixed(1));

    });
    reportAnalyst.dateExtent = d3.extent(data,function(d){return d.start_time_d;});
    reportAnalyst.durationExtent = d3.extent(data,function(d){return d.durationMinutes;});
    reportAnalyst.waitExtent = d3.extent(data,function(d){return d.waitMinutes;});
    reportAnalyst.distanceExtent = d3.extent(data,function(d){return d.distance;})
    reportAnalyst.data = data;

    console.log('haha',data);
    // //console.log('update data',data);
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
    //console.log('model analyst data', data);
    reportAnalyst.modelTrips = crossfilter(reportAnalyst.dataset);

    reportAnalyst.modelRoutes = reportAnalyst.modelTrips.dimension(function(d){return d.route;});
    reportAnalyst.modelRoutesGroup = reportAnalyst.modelRoutes.group();
    reportAnalyst.modelRoutesRunGroup = reportAnalyst.modelRoutes.group().reduce(
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) + 1; return p;},
      function (p, v) {p[v.modelRun] = (p[v.modelRun] || 0) - 1; return p;},
      function () { return {}; }
    );


    reportAnalyst.modelOnStop = reportAnalyst.modelTrips.dimension(function(d){return d.on_stop_code;});
    reportAnalyst.modelOnStopGroup = reportAnalyst.modelOnStop.group(function(d) {return d});

    reportAnalyst.modelOffStop = reportAnalyst.modelTrips.dimension(function(d){return d.off_stop_code;});
    reportAnalyst.modelOffStopGroup = reportAnalyst.modelOffStop.group();

    reportAnalyst.modelTripCount= reportAnalyst.modelTrips.dimension(function(d){return d.trip_id;});
    reportAnalyst.modelTripCountGroup = reportAnalyst.modelTripCount.group();

    reportAnalyst.transfer_counts = crossfilter(reportAnalyst.modelTripCountGroup.all())
        .dimension(function(d){return d.value-1;}).group();

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

    
  },
  clearGraphs: function() {
    d3.select('#graphDiv').selectAll('svg').remove();
  },
  RoutesGraph: function() {
     var routeCountChart = dc.compositeChart("#route-count");
     var width=800,height=400;
     var gap = (width*.9)/(reportAnalyst.modelRoutesRunGroup.all().length*(reportAnalyst.modelRuns.length*2));
     var translate =  (width*.9)/(reportAnalyst.modelRoutesRunGroup.all().length*reportAnalyst.modelRuns.length)-gap;
     var compositer = [];
     var colors = colorbrewer.Set1[5];
     //colors.shift();
     reportAnalyst.modelRuns.forEach(function(run,dex){
        compositer.push(dc.barChart(routeCountChart)
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
 
    routeCountChart
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
      });
      

      // .group(reportAnalyst.modelRoutesRunGroup,reportAnalyst.modelRuns[0])
      // .valueAccessor(function (d) {
      //     return d.value[reportAnalyst.modelRuns[0]];
      // })
      // if(reportAnalyst.modelRuns.length > 1){
      //   for(var runIndex = 1; runIndex < reportAnalyst.modelRuns.length; runIndex++){
      //     console.log('modelruns[runIndex]:',reportAnalyst.modelRuns[runIndex],runIndex);
      
      //     routeCountChart.stack(reportAnalyst.modelRoutesRunGroup, reportAnalyst.modelRuns[runIndex], function (d) {
      //       console.log('stack',d.value,reportAnalyst.modelRuns[runIndex-1],runIndex);
      //       return d.value[reportAnalyst.modelRuns[runIndex-1]];
      //     });
      //   }
      // }

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
        .x(d3.scale.linear().domain([1,120]))
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
  renderGraphs: function(){
    reportAnalyst.RoutesGraph();
    reportAnalyst.StartTimeGraph();
    reportAnalyst.DurationGraph();
    reportAnalyst.WaitTimeGraph();
    reportAnalyst.distanceGraph();
    dc.renderAll();
  }
};


