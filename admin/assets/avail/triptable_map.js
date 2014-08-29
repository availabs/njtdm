(function() {
    var triptableMap = {};

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

    triptableMap.init = function(svgID,marketarea) {
        width = $('.tab-content').width()-40;
        height =  width;

        zoom = d3.behavior.zoom()
            .scale(1<<15)
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

        d3.json('/data/tracts.json', function(error, data) {
            tracts = data;
            tracts.features.forEach(function(feat){
                if(marketarea.zones.indexOf(feat.properties.geoid) !== -1){
                   marketAreaTractsList.push(feat.properties.geoid);
                   marketAreaTracts.features.push(feat);
                }
            });
            draw(marketAreaTracts, 'ma12','market');
            //zoomToFullExtent(marketAreaTracts);

        });

        
    }

    function zoomToFullExtent(tracts){
    	
    	var bounds = d3.geo.bounds(tracts),
		      dx = bounds[1][0] - bounds[0][0],
		      dy = bounds[1][1] - bounds[0][1],
		      x = (bounds[0][0] + bounds[1][0]) / 2,
		      y = (bounds[0][1] + bounds[1][1]) / 2,
		      scale = .9 / Math.max(dx / width, dy / height),
		      translate = [width / 2 - scale * x, height / 2 - scale * y];


	    svg.transition()
	      .duration(750)
	      .call(zoom.translate(translate).scale(scale).event);

	    console.log('scaling',projection.scale(scale));
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

        svg.selectAll('path').attr('d', path)
    }

  

    this.triptableMap = triptableMap;
})()