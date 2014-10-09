(function() {
    var editmap = {};

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
        marketAreaCounties= {
            type: "FeatureCollection",
            features: []
        },
        marketarea ={};


    function zoomed() {
        projection.scale(zoom.scale())
            .translate(zoom.translate());

        svg.selectAll('path').attr('d', path);
    }

    editmap.init = function(svgID,market_in) {
        marketarea = market_in;        
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
            .style('background-color', '#fff')
            .call(zoom)
            .on("dragstart", function() {
                d3.event.sourceEvent.stopPropagation(); // silence other listeners
            });

        svg.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', '#fff')

        marketarea.counties = marketarea.counties;
        d3.json ('/data/counties.json',function(err,counties){
            topojson.feature(counties, counties.objects.tracts)
            .features.forEach(function(county){
                if(marketarea.counties.indexOf(''+county.properties.geoid) !== -1){
                    marketAreaCounties.features.push(county);
                }
            }); 
            if(marketAreaCounties.features.length > 0){
                draw(marketAreaCounties, 'counties','county');
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
                draw(marketAreaTracts, 'ma12','market');
            });
        });

        d3.xhr('/marketarea/'+marketarea.origin_gtfs+'/ma_route_data')
            .response(function(request) {
                return JSON.parse(request.responseText);
            })
            .post(JSON.stringify({ routes: marketarea.routes }), function(error, routes) {
                //console.log('routes topo',routes);
                //routes = topojson.feature(routes, routes.objects.routes);
               // console.log('routes geo',routes);
                draw(routes, 'routes12','route');
            })
    }

    editmap.getRouteData = function(gtfsID, routeID, cb) {
        var route = '/marketarea/'+gtfsID+'/'+routeID+'/route_geo';

        d3.json(route, function(error, data) {

            findIntersectingMarketAreas(data, routeID);

            draw(data, 'route-'+routeID,'route');
            
            var b = d3.geo.bounds(marketAreaTracts);
            var center = [(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2];

            cb(marketarea.zones, center);
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
            if(marketarea.zones.indexOf(feat.properties.geoid) === -1){
               marketarea.zones.push(feat.properties.geoid);
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
            

        if(type == 'market'){
            
            paths
            .attr('class', function(d){
                if(marketarea.zones.indexOf(d.properties.geoid) != -1){
                    return 'in-market';
                }
                return 'nonMarket'
            })
            .on('click',function(d){
                if (d3.event.ctrlKey) {
                    var tract = d3.select(this);
                    if(marketarea.zones.indexOf(d.properties.geoid) === -1){
                       marketarea.zones.push(d.properties.geoid);
                       tract.attr("class", 'market');
                    }else{
                        marketarea.zones.splice(marketarea.zones.indexOf(d.properties.geoid),1);
                        tract.attr("class", 'nonMarket');
                    }
                }
            })

        }else{
            paths.attr('class', type)
        }
        if(type == 'route'){
            paths
            .attr('id',function(d){
                //console.log(d);
                return 'route-'+d.properties.route_short_name;
            })
        }

        paths.exit().remove();

        svg.selectAll('path').attr('d', path)
    }

    editmap.removeRoute = function(routeID) {
        d3.selectAll('#route-'+routeID)
            .each(function(data) {
                //findIntersectingMarketAreas(data, -1);
            })
            .remove();

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