(function() {
    var njmap = {};

    var svg,
        width,
        height;

    var zoom,
        projection,
        path;

    var tracts;

    var marketAreaTracts = {
            type: "FeatureCollection",
            features: []
        },
        marketAreaTractsList = [];

    function zoomed() {
        projection.scale(zoom.scale())
            .translate(zoom.translate());

        svg.selectAll('path').attr('d', path);
    }

    njmap.init = function(svgID,marketarea) {

        width = $('.tab-content').width()-15;
        height =  width;

        zoom = d3.behavior.zoom()
            .scale(1<<16)
            .translate([width/2, height/2])
            .scaleExtent([1<<12, 1<<20])
            .on("zoom", zoomed);

        projection = d3.geo.albers()
            .translate(zoom.translate())
            .scale(zoom.scale());

        path = d3.geo.path()
            .projection(projection);

        svg = d3.select(svgID)
            .attr('width', width)
            .attr('height', height)
            //.style('background-color', '#fff')
            .call(zoom)
            .on("dragstart", function() {
                d3.event.sourceEvent.stopPropagation(); // silence other listeners
            });

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#fff')

        d3.json('/data/tracts.json', function(error, data) {
            tracts = data;
            tracts.features.forEach(function(feat){
                if(marketarea.zones.indexOf(feat.properties.geoid) !== -1){
                   marketAreaTractsList.push(feat.properties.geoid);
                   marketAreaTracts.features.push(feat);

                }
            });
            // console.log('draw ma',marketAreaTracts);
            // draw(marketAreaTracts, 'ma12','market');
        });
        console.log(marketarea.routes);
        // io.socket.post('/marketarea/'+marketarea.origin_gtfs+'/routes_geo',{route_id:marketarea.routes},function(routes){
        //     console.log(routes);
        // })

       
    }

    njmap.getRouteData = function(gtfsID, routeID,cb) {
        var route = '/marketarea/'+gtfsID+'/'+routeID+'/route_geo';

        d3.json(route, function(error, data) {
            // data = topojson.feature(data, data.objects.states);
            console.log('get routes data',data);
            findIntersectingMarketAreas(data, routeID);

            draw(data, 'route-'+routeID,'route');
            
            var b = d3.geo.bounds(marketAreaTracts);
            var center = [(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2];
            console.log('get route collisions',marketAreaTractsList);
            cb(marketAreaTractsList,center);
        })

    }

    function findIntersectingMarketAreas(route, ID) {
        if (!tracts) {
            return console.log("tracts data not loaded!");
        }

        var routeBounds = path.bounds(route),
            collection = {
                type: "FeatureCollection",
                features: []
            };

        tracts.features.forEach(function(tract) {
            var tractBounds = path.bounds(tract);

            if (boundsCollision(routeBounds, tractBounds)) {
                collection.features.push(tract);
            }
        })

        collection.features.forEach(function(feat){
            if(marketAreaTractsList.indexOf(feat.properties.geoid) === -1){
               marketAreaTractsList.push(feat.properties.geoid);
               marketAreaTracts.features.push(feat);     
            }
        });

        if (collection.features.length) {
            draw(collection, 'market-'+ID,'zone')
        }
    }

    function boundsCollision(route, tract) {
        var routeRect = {left: route[0][0], top: route[0][1], width: route[1][0] - route[0][0], height: route[1][1] - route[0][1]};

        var tractRect = {left: tract[0][0], top: tract[0][1], width: tract[1][0] - tract[0][0], height: tract[1][1] - tract[0][1]};

        var xCollision =  ((routeRect.left <= tractRect.left) && (routeRect.left + routeRect.width > tractRect.left)) ||
                          ((routeRect.left > tractRect.left) && (routeRect.left < tractRect.left + tractRect.width));

        var yCollision = ((routeRect.top <= tractRect.top) && (routeRect.top + routeRect.height > tractRect.top)) ||
                         ((routeRect.top > tractRect.top) && (routeRect.top < tractRect.top + tractRect.height));

        return xCollision && yCollision;
    }

    function draw(data, groupID,type) {
        var centroid = path.centroid(data),
            translate = projection.translate();

        projection.translate([translate[0] - centroid[0] + width / 2,
                              translate[1] - centroid[1] + height / 2]);

        zoom.translate(projection.translate());

        var group = svg.selectAll('#'+groupID)
            .data([groupID], function(d) { return d; });

        group.enter().append('g')
            .attr('id', function(d) { return d; });

        group.exit().remove();

        var paths = group.selectAll('path')
            .data(data.features)

        paths.enter().append('path')
            .attr('class', type)
            

        paths.exit().remove();

        d3.selectAll('path').attr('d', path)
    }

    njmap.removeRoute = function(routeID) {
        d3.selectAll('#route-'+routeID)
            .each(function(data) {
                findIntersectingMarketAreas(data, -1);
            })
            .remove();
            
        var b = d3.geo.bounds(marketAreaTracts);
        var center = [(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2];

        cb(marketAreaTractsList,center);
    }

    this.njmap = njmap;
})()