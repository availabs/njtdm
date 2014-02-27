/***
**
** Data Analytics Logic
**
******/
tripTable = {
  tt_array : [],
  tt : {},
  svg : {},
  g : 'unset',
  origins : {},
  dests : {},
  init : function() {
     tripTable.g = censusGeo.g;
      $('circle.dest').css('display','none');
      $('circle.origin').css('display','none');
  },
  update_data:function(trips){
    tripTable.tt = {};
    tripTable.tt_array = trips;
    trips.forEach(function(trip){
      if(trip.from_geoid in tripTable.tt){
        tripTable.tt[trip.from_geoid].outbound_trips +=1;
      }else{
        tripTable.tt[trip.from_geoid] = {'inbound_trips':0,'outbound_trips':1};
      }

      if(trip.to_geoid in tripTable.tt){
        tripTable.tt[trip.to_geoid].inbound_trips +=1;
      }else{
        tripTable.tt[trip.to_geoid] = {'inbound_trips':1,'outbound_trips':0};
      }
    });
  },
  draw_trips : function (){
    //console.log('draw trips',tripTable.tt_array);
    tripTable.g.selectAll("circle.origin").remove();
    tripTable.g.selectAll("circle.dest").remove();

    tripTable.origins = tripTable.g.selectAll("circle.origin")
      .data(tripTable.tt_array)
      .enter()
      .append("circle")
      .attr({
        r: 4,
        cx: function(d,i) {
          return tripTable.project(d.from_coords)[0];
        },
        cy: function(d,i) {
          return tripTable.project(d.from_coords)[1];
        },
        fill:"#000",
        class : function(d,i){
          return 'origin';
        }
      });

    tripTable.dests = tripTable.g.selectAll("circle.dest")
      .data(tripTable.tt_array)
      .enter()
      .append("circle")
      .attr({
        r: 4,
        cx: function(d,i) {
          return tripTable.project(d.to_coords)[0];
        },
        cy: function(d,i) {
          return tripTable.project(d.to_coords)[1];
        },
        fill:"#fff",
        class : function(d,i){
          return 'dest';
        }
      });
      censusGeo.map.on("viewreset", function(){
        tripTable.reset_orig(tripTable.origins);
        tripTable.reset_dest(tripTable.dests);
      });
      tripTable.reset_orig(tripTable.origins);
      tripTable.reset_dest(tripTable.dests);
  },
  project :function(x) {
      if(x.length != 2){ return [];}
      var point = censusGeo.map.latLngToLayerPoint(new L.LatLng(x[0], x[1]));
      return [point.x, point.y];
  },
  update_trips : function(){
    if(tripTable.g !== 'unset' && tripTable.tt_array.length >=  0){
      
      tripTable.origins = tripTable.g.selectAll("circle.origin")
        .data(tripTable.tt_array);

      tripTable.origins
        .enter()
        .append("circle")
        .attr({
            r: 4,
            cx: function(d,i) {
              return tripTable.project(d.from_coords)[0];
            },
            cy: function(d,i) {
              return tripTable.project(d.from_coords)[1];
            },
            fill:"#000",
            class : function(d,i){
              return 'origin';
            }
          });
      
      tripTable.origins
        .exit()
        .remove();

      tripTable.dests = tripTable.g.selectAll("circle.dest")
        .data(tripTable.tt_array);
      
      tripTable.dests
        .enter()
         .append("circle")
         .attr({
              r: 4,
              cx: function(d,i) {
                return tripTable.project(d.to_coords)[0];
              },
              cy: function(d,i) {
                return tripTable.project(d.to_coords)[1];
              },
              fill:"#fff",
              class : function(d,i){
                return 'dest';
              }
            });

        tripTable.dests
          .exit()
          .remove();

        tripTable.reset_orig(tripTable.origins);
        tripTable.reset_dest(tripTable.dests);
      }
  },
  reset_orig:function (feature) {
        
    feature
      .attr("cx", function(d) {
          return tripTable.project(d.from_coords)[0];
        })
        .attr("cy", function(d) {
            return tripTable.project(d.from_coords)[1];
        });
      
  },reset_dest:function (feature) {
        
    feature
      .attr("cx", function(d) {
          return tripTable.project(d.to_coords)[0];
        })
        .attr("cy", function(d) {
            return tripTable.project(d.to_coords)[1];
        });
  }


};
