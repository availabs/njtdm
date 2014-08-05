/***********************************************************************
*censusGeo Geography Logic
***********************************************************************/
censusGeo = {
  map : {},
  geodata : {},
  selection : {},
  svg: {},
  g:{},
  feature : {},
  scenario_tracts : [],
  scenario_tracts_features : [],
  bounds : [],
  legend_domain : {},
  ll:6,
  color:[],
  brewer:['YlGn','YlGnBu','GnBu','BuGn','PuBuGn','PuBu','BuPu','RdPu','PuRd','OrRd','YlOrRd','YlOrBr','Purples','Blues','Greens','Oranges','Reds','Greys','PuOr','BrBG','PRGn','PiYG','RdBu','RdGy','RdYlBu','Spectral','RdYlGn','Accent','Dark2','Paired','Pastel1','Pastel2','Set1','Set2','Set3'],
  brewer_index : 1,
  choropleth_var: undefined,
  current_map : 'none',
  draw:function(){
    var geo = topojson.feature(censusGeo.geodata, censusGeo.geodata.objects.tracts);
    var bounds = d3.geo.bounds(geo);
    path = d3.geo.path().projection(censusGeo.project);

    censusGeo.svg = d3.select(censusGeo.map.getPanes().overlayPane).append("svg");
    censusGeo.g = censusGeo.svg.append("g").attr("class", "leaflet-zoom-hide tracts");
    censusGeo.scenario_tracts_features = [];
    censusGeo.feature = censusGeo.g.selectAll("path.tract")
      .data(geo.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id",function(d){ return "tract_"+d.properties.geoid;})
      .attr("class", function(d){
        if(censusGeo.scenario_tracts.indexOf(d.properties.geoid) !== -1){
          censusGeo.scenario_tracts_features.push(d);
          return "selected_tract";
        }
        return "tract";
      })
      .on("click",function(d) {
        if (d3.event.ctrlKey) {
          if(d3.select(this).attr('class')=='tract'){
            d3.select(this).attr('class', 'selected_tract');
            censusGeo.scenario_tracts.push(d.properties.geoid);
          }else{
            d3.select(this).attr('class', 'tract');
            var index =censusGeo.scenario_tracts.indexOf(d.properties.geoid);
            if (index > -1) {
              censusGeo.scenario_tracts.splice(index, 1);
            }
          }
        }
      })
      .on("mouseover", function(d){
          if(d3.select(this).attr('class')=='selected_tract'){
            var textTitle = "<p>";
            textTitle += "<strong>Geo ID:</strong>" + d.properties.geoid + "<br>";
            textTitle += "<strong>Population:</strong> "+ number_format(censusData.acs[d.properties.geoid].total_population) +" <br>";
            // textTitle += "<strong>Employment:</strong> "+ number_format(censusData.acs[d.properties.geoid].employed) +" <br>";
            // textTitle += "<strong>Unemployment:</strong> "+ number_format(censusData.acs[d.properties.geoid].unemployed) +" <br>";
            textTitle += "<strong>Bus to Work:</strong> "+ number_format(censusData.acs[d.properties.geoid].bus_to_work) +" ("+ number_format((censusData.acs[d.properties.geoid].bus_to_work/censusData.acs[d.properties.geoid].travel_to_work_total*100).toFixed(2)) +"%) <br>";
            var inbound_trips = 0,outbound_trips = 0;

            if(typeof tripTable.tt[d.properties.geoid] != 'undefined'){
              inbound_trips = tripTable.tt[d.properties.geoid].inbound_trips;
              outbound_trips = tripTable.tt[d.properties.geoid].outbound_trips;
            }
            textTitle += "<strong>Trip Table inbound:</strong> "+ number_format(inbound_trips) +" <br>";
            textTitle += "<strong>Trip Table outbound:</strong> "+ number_format(outbound_trips) +" <br>";
            $("#info").show().html(textTitle);
          }
        })
        .on("mouseout", function(self) {
          $("#info").hide().html("");
        });
      
      
      
      censusGeo.map.on("viewreset", function(){
        censusGeo.reset(bounds,censusGeo.feature);
      });
      censusGeo.reset(bounds,censusGeo.feature);

  },
  choropleth_trip_table:function(var_name){
        //console.log('running'+var_name);
        var max=0;
        var min=1000000;
        censusGeo.current_map = "Trip Table "+var_name;
        censusGeo.scenario_tracts.forEach(function(d){
          if(typeof tripTable.tt[d] != 'undefined' ){
            if(tripTable.tt[d][var_name] > max){
              max = tripTable.tt[d][var_name];
            }
            else if(tripTable.tt[d][var_name] < min){
              min = tripTable.tt[d][var_name];
            }
          }
        });
        censusGeo.legend_domain = d3.scale.quantile()
          .domain([min,max])
          .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);

        // this function iterates through the calculated quantiles. When the input val
        // is less then or equal to a quantile, a color from the color range is selected.
        // if the input value is greater than the last quantile then the last color
        // range is selected.
        censusGeo.color = function(val) {
          // range and domain functions were added in order to maintain compatibility
          // with other project functions that use d3.scale functions as color scales
          censusGeo.color.range = function() {
            return colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll];
          };
          censusGeo.color.domain = function() {
            return censusGeo.legend_domain.quantiles();
          };

          var domain = censusGeo.color.domain(),
              colors = censusGeo.color.range();

          for (var i = 0; i < domain.length; i++) {
            if (val <= domain[i])
              return colors[i];
          }
          return colors[i];
        };

        /*
        censusGeo.color = d3.scale.quantile()
            .domain(censusGeo.legend_domain.quantiles())
            .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);
        */

        censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
          .style("fill",function(d){
            if(typeof tripTable.tt[d.properties.geoid] == 'undefined'){
              return "#0f0";
            }else{
              return censusGeo.color(tripTable.tt[d.properties.geoid][var_name]);
            }


        });
        censusGeo.setLegend();
  },

  setLegend:function(){
    var color, label, label2, i; // temp variables
    if(typeof censusGeo.color.domain == 'function'){
      var domain = censusGeo.color.domain(),
          range = censusGeo.color.range();
      // create legend label
      var name = censusGeo.current_map.split(' ');
      //console.log(name, name[name.length-1])
      name[name.length-1] = esc.capitalizeAll(name[name.length-1], '_');
      name = name.join(' ');
      var legendText = '<h3>'+name+'</h3>';
      // start unordered list
      legendText += '<ul id="censusGeo_legend">';
      // add first list element
      color = range[0];
      label = domain[0]+1;
      legendText += '<li><svg width="20" height="20"><rect width="300" height="100" fill="'+color+'"></rect></svg><span>&lt; '+label.toFixed(0)+'</span></li>';
      // iterate through color domain, appending list elements
      for (i = 1; i < domain.length; i++) {
        color = range[i];
        label = domain[i];
        label2 = domain[i-1]+1;
        legendText += '<li><svg width="20" height="20"><rect width="300" height="100" fill="'+color+'"></rect></svg><span>'+label2.toFixed(0)+'-'+label.toFixed(0)+'</span></li>';
      }
      // add last label
      color = range[i];
      label = domain[i-1];
      legendText += '<li><svg width="20" height="20"><rect width="300" height="100" fill="'+color+'"></rect></svg><span>&gt; '+label.toFixed(0)+'</span></li>';

      // close unordered list tag
      legendText += '</ul>';

      $('#choro_legend').html(legendText);
    }
  },

  choropleth_single:function(var_name){
        censusGeo.current_map = "Census "+var_name;
        var max=0;
        var min=1000000;
        censusGeo.scenario_tracts.forEach(function(d){
          //console.log(f.properties)
          if(censusData.acs[d][var_name] > max){
            max = censusData.acs[d][var_name];
          }
          else if(censusData.acs[d][var_name] < min){
            min = censusData.acs[d][var_name];
          }
        });
        censusGeo.legend_domain = d3.scale.quantile()
          .domain([min,max])
          .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);


        censusGeo.color = d3.scale.quantile()
            .domain(censusGeo.legend_domain.quantiles())
            .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);

        censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
          .style("fill",function(d){
            if(censusData.acs[d.properties.geoid][var_name] === null){
              return "#f00";
            }else{
              return censusGeo.color(censusData.acs[d.properties.geoid][var_name]);
            }

        });
        censusGeo.setLegend();

  },
  choropleth_percent:function(var_name,divisor){

        var max=0;
        var min=1000000;
        censusGeo.scenario_tracts.forEach(function(d){
          //console.log(f.properties)
          if(censusData.acs[d][var_name]/censusData.acs[d][divisor] > max){
            max = censusData.acs[d][var_name]/censusData.acs[d][divisor];
          }
          else if(censusData.acs[d][var_name]/censusData.acs[d][divisor] < min){
            min = censusData.acs[d][var_name]/censusData.acs[d][divisor];
          }
        });
        censusGeo.legend_domain = d3.scale.quantile()
          .domain([min,max])
          .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);


        censusGeo.color = d3.scale.quantile()
            .domain(censusGeo.legend_domain.quantiles())
            .range(colorbrewer[censusGeo.brewer[censusGeo.brewer_index]][censusGeo.ll]);

        censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
          .style("fill",function(d){
            if(censusData.acs[d.properties.geoid][var_name] == null){
              return "#f00";
            }else{
              var data = (censusData.acs[d.properties.geoid][var_name])/(censusData.acs[d.properties.geoid][divisor]);
              return censusGeo.color(data);
            }

        });
        //viz.setLegend();
  },
  update_scenario:function(){
      censusGeo.scenario_tracts_features = [];
      censusGeo.g.selectAll("path.tract")
        .transition().duration(1000)
        .attr("class", function(d){
        if(censusGeo.scenario_tracts.indexOf(d.properties.geoid) !== -1){
          censusGeo.scenario_tracts_features.push(d);
          return "selected_tract";
        }
        return "tract";
        });

      censusGeo.g.selectAll("path.selected_tract")
        .transition().duration(1000)
        .style('fill','none')
        .attr("class", function(d){
        if(censusGeo.scenario_tracts.indexOf(d.properties.geoid) !== -1){
          censusGeo.scenario_tracts_features.push(d);
          return "selected_tract";
        }
        return "tract";
        });
  },
  project :function(x) {
      if(x.length != 2){ return [];}
      var point = censusGeo.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
      return [point.x, point.y];
  },
  reset :function (bounds,feature) {
     var bottomLeft = censusGeo.project(bounds[0]),
        topRight = censusGeo.project(bounds[1]);
        
        censusGeo.svg.attr("width", topRight[0] - bottomLeft[0])
          .attr("height", bottomLeft[1] - topRight[1])
          .style("margin-left", bottomLeft[0] + "px")
          .style("margin-top", topRight[1] + "px");

    censusGeo.g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
    
    feature
      .attr("d", path);
      
  }
};
