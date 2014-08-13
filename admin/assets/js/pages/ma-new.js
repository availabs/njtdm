$(function(){
    function pageLoad(){
                        
        njmap.init('#new-market-svg');
        
        $('.chzn-select').select2();
        $("#wizard").bootstrapWizard({onTabShow: function(tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index+1;
            var $percent = ($current/$total) * 100;
            var $wizard = $("#wizard");
            $wizard.find('.progress-bar').css({width:$percent+'%'});

            if($current >= $total) {
                $wizard.find('.pager .next').hide();
                $wizard.find('.pager .finish').show();
                $wizard.find('.pager .finish').removeClass('disabled');
            } else {
                $wizard.find('.pager .next').show();
                $wizard.find('.pager .finish').hide();
            }
        }});
        
    }

    pageLoad();

    PjaxApp.onPageLoad(pageLoad);
});
function maNewController($scope){
    $scope.marketarea = {};
    $('#gtfs-select').on('change',function(){
        gtfsID = parseInt($('#gtfs-select').val());
        if(typeof gtfsID === 'number'){
           $.ajax('/gtfs/'+gtfsID+'/routes') 
           .done(function(data) {
                $scope.marketarea.origin_gtfs = gtfsID;
                $scope.routes = {};
                $scope.marketarea.routes = [];     

                data.forEach(function(route) {

                    $('#routes-select')
                        .append($('<option>', { 
                            value : route.route_id, 
                            text  : route.route_short_name
                        })
                    )
                    $scope.routes[route.route_id] = route.route_short_name;
                });
                
                $('#add-route-btn').on('click',function(){
                    $('#new-market-error-div').hide();
                    $('new-market-svg').show();

                    njmap.getRouteData($('#gtfs-select').val(), $('#routes-select').val(),function(tracts,center){
                        $scope.marketarea.zones = tracts;
                        $scope.marketarea.centroid = center
                        $scope.$apply();
                    });
                    

                    $scope.marketarea.routes.push($('#routes-select').val());
                    $scope.$apply();
                    
                    
                })
            })
           .fail(function(err) { console.log('/gtfs/'+gtfsID+'/routes error',err); })
        }
    });
    $scope.removeRoute = function(index){
        $scope.marketarea.routes.splice(index,1);
        //$scope.appl
    }
    $scope.createMarketarea = function(){
        io.socket.post('/marketarea',$scope.marketarea,function(data){ 
            console.log('Created!',data); 
        });
    }
}


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

    njmap.init = function(svgID) {

        width = $('.tab-content').width();
        height = 790;

        zoom = d3.behavior.zoom()
            .scale(1<<17)
            .translate([width/2, height/2])
            .scaleExtent([1<<12, 1<<20])
            .on("zoom", zoomed);

        projection = d3.geo.albers()
            .translate(zoom.translate())
            .scale(zoom.scale());

        path = d3.geo.path()
            .projection(projection);

        d3.json('/data/tracts.json', function(error, data) {
            tracts = data;
        });

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
    }

    njmap.getRouteData = function(gtfsID, routeID,cb) {
        var route = '/marketarea/'+gtfsID+'/'+routeID+'/route_geo';

        d3.json(route, function(error, data) {
            // data = topojson.feature(data, data.objects.states);

            findIntersectingMarketAreas(data, routeID);

            draw(data, 'route-'+routeID,'route');
            
            var b = d3.geo.bounds(marketAreaTracts);
            var center = [(b[0][0]+b[1][0])/2,(b[0][1]+b[1][1])/2];
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

    }

    this.njmap = njmap;
})()