(function() {
    var triptableMap = {};

    var svg,
        width,
        height;

    var zoom,
        projection,
        path;

    var tracts;
    
    var legendGroup;

    var margin = {top: 30};

    var marketAreaTracts = {
            type: "FeatureCollection",
            features: []
        },
        marketAreaTractsList = [],
        marketAreaCounties= {
            type: "FeatureCollection",
            features: []
        };

    var clickedTract = null;

    triptableMap.triptable = []

    function zoomed() {
        projection.scale(zoom.scale())
            .translate(zoom.translate());

        svg.selectAll('path').attr('d', path);
    }

    var colorRange = {
        1: ["#ffffbf"],
        2: ["#fc8d59","#91bfdb"].reverse(),
        3: ["#fc8d59","#ffffbf","#91bfdb"].reverse(),
        4: ["#d7191c","#fdae61","#abd9e9","#2c7bb6"].reverse(),
        5: ["#d7191c","#fdae61","#ffffbf","#abd9e9","#2c7bb6"].reverse(),
        6: ["#d73027","#fc8d59","#fee090","#e0f3f8","#91bfdb","#4575b4"].reverse(),
        7: ["#d73027","#fc8d59","#fee090","#ffffbf","#e0f3f8","#91bfdb","#4575b4"].reverse(),
        8: ["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"].reverse(),
        9: ["#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4"].reverse(),
        10: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"].reverse(),
        11: ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"].reverse()
    }

    var colorScale = d3.scale.quantize();

    var trafficType;

    triptableMap.init = function(svgID,marketarea) {
        width = $('.tab-content').width()-40;
        height =  width;
        //zoomToBounds(marketAreaTracts);
        
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
            .on('click',reset)


            d3.json('/data/tracts.json', function(error, data) {
                tracts = data;
                tracts.features.forEach(function(feat){
                    // if(marketarea.counties.indexOf(feat.properties.geoid.substring(0, 5)) !== -1){
                        
                    // }
                    if(marketarea.zones.indexOf(feat.properties.geoid) !== -1){
                        marketAreaTractsList.push(feat.properties.geoid);
                        marketAreaTracts.features.push(feat);
                        
                    }
                });
                draw(marketAreaTracts, 'ma12','market');
            });   
            
        
        var buttonWidth = 75,
            buttonHeight = 30;

        var data = [
            {text: 'Outbound', id: 'outbound'}, 
           {text: 'Inbound', id: 'inbound'}
        ]

        svg.selectAll('.ctpp-button-group')
            .data(data)
            .enter().append('g')
            .attr('class', 'ctpp-button-group')
            .on('click', toggleDirectionButtons)
            .each(function(d, i) {
                var g = d3.select(this);

                g.append('rect')
                    .attr('id', function() { return 'ctpp-button-'+d.id; })
                    .attr('class', 'acs-button')
                    .attr('y', function() { return 40 + buttonHeight*i; })
                    .attr('width', buttonWidth)
                    .attr('height', buttonHeight);

                g.append('text')
                    .attr('x', buttonWidth/2)
                    .attr('y', function() { return 40 + buttonHeight*i + buttonHeight/2; })
                    .text(function() { return d.text; })
                    //.style('fill', '#000')
                    .style('text-anchor', 'middle');
            })

        legendGroup = svg.append('g').attr('class','legend');    
        d3.select('.ctpp-button-group').each(toggleDirectionButtons);
        
    }


    triptableMap.updateData = function(data){
        triptableMap.triptable = data;
        d3.select('.ctpp-button-group').each(toggleDirectionButtons);
    }
 
    function toggleDirectionButtons(data) {
        d3.selectAll('.ctpp-button-group')
            .select('rect')
            .classed('acs-button-active', function(d, i) {
                return 'ctpp-button-'+data.id == d3.select(this).attr('id');
            });

        trafficType = data.id;

        if (!clickedTract) {
            reset(triptableMap.triptable);
        }
        else {
            clicked(null);
        }
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
            .attr('id', function(d) { return 'ctpp-tract-'+d.properties.geoid; })
        
        if(type == 'market'){
            paths
            .attr('class', function(d){
                if(marketAreaTractsList.indexOf(d.properties.geoid) != -1){
                    return 'market';
                }
                return 'nonMarket'
            })
            .on('click', clicked);
        }

        if(type == 'county'){
            paths
                .attr('stroke-dasharray',"20,10,5,5,5,10")
                .attr('class', type)
            
        }

        paths.exit().remove();

        svg.selectAll('path').attr('d', path)
    }
    
    function reset() {  
        if(triptableMap.triptable.length > 0){

            var colorDomain = [];
            var data = {};
            var sumKey = 'from_geoid';
            if(trafficType === 'inbound'){
                sumKey = 'to_geoid';
            }
            triptableMap.triptable.forEach(function(trip){
                if(typeof data[trip[sumKey]] == 'undefined'){
                    data[trip[sumKey]] = 1;
                }else{
                    data[trip[sumKey]] += 1;
                }
            })

            marketAreaTracts.features.forEach(function(d, i) {
                marketAreaTracts.features[i].properties.numTrips = data[d.properties.geoid] || 0;
                pushUnique(colorDomain, data[d.properties.geoid] || 0);
            })

            clickedTract = null;

            //populateCTPPtable(marketAreaTracts.features, data);

            setColorScale(colorDomain)

            svg.selectAll('path')
                .classed('ctpp-tract-active', false)
                .style('fill', function(d) {
                    if (d.properties.numTrips === 0) {
                        return null;
                    }
                    return colorScale(d.properties.numTrips);
                })

            drawLegend();
        
            svg.selectAll('.temp-tract').remove();

        }
    }  

    function clicked(d) {
        if(triptableMap.triptable.length > 0){
            if (d) {
                if (d.properties.numTrips === 0 || d === clickedTract) {
                    reset();
                    return;
                }
                clickedTract = d;
            }

            svg.selectAll('.temp-tract').remove();

            var tracts = svg.selectAll('path')
                .style('fill', null)
                .classed('ctpp-tract-active', false);

            d3.select('#ctpp-tract-'+clickedTract.properties.geoid)
                .classed('ctpp-tract-active', true);

            //d3.json('/marketarea/'+clickedTract.properties.geoid+'/'+trafficType+'/ctpp_travel_data', function(error, data) {
            var data = {};
            var sumKey = 'from_geoid',
                opposite = 'to_geoid';
            if(trafficType === 'inbound'){
                sumKey = 'to_geoid';
                opposite = 'from_geoid';

            }
            triptableMap.triptable.forEach(function(trip){
                if(trip[sumKey] == clickedTract.properties.geoid){
                    if(typeof data[trip[opposite]] == 'undefined'){
                        data[trip[opposite]] = 1;
                    }else{
                        data[trip[opposite]] += 1;
                    }
                }
            })

 
            var toTracts = {},
                colorDomain = [];

            var tableData = [];
                
            for(key in data){
                pushUnique(colorDomain, data[key]);
                toTracts[key] = data[key];

                // obj = {properties: {geoid: d.geoid}}
                // tableData.push(obj);
                // if (d.geoid in tractFeatures) {
                //     tableData.push(tractFeatures[d.geoid]);
                // }
                // else {
                //     tableData.push({properties: {geoid: d.geoid }});
                // }
            }

            setColorScale(colorDomain)

            tracts.filter(function(d) { return (d.properties.geoid in toTracts); })
                .style('fill', function(d) { return colorScale(toTracts[d.properties.geoid]); })

            //populateCTPPtable(tableData, toTracts);

            drawLegend();
        }
        
    }

    function drawLegend() {
        var legend = legendGroup.selectAll('g')
            .data(colorScale.range());

        var wdth = width / colorScale.range().length;

        legend.exit().remove();

        legend.enter().append('g');

        legend
            .attr('transform', function(d, i) {
                return 'translate('+(i * wdth)+',0)';
            })
            .each(function(d) {
                var group = d3.select(this),
                    format = d3.format('<,');

                group.append('rect')
                    .attr('height', margin.top)
                    .attr('width', wdth)
                    .attr('fill', function(d) { return d; })

                group.append('text')
                    .text(function(d) {
                        return format(Math.round(colorScale.invertExtent(d)[0]));
                    })
                    .attr('x', 5)
                    .attr('y', margin.top-5)
                    .style('fill', '#000')
                    .style('text-anchor', 'left');
            })
    }

    function setColorScale(colorDomain) {

        if(typeof colorDomain != 'undefined'){
            console.log('setColorScale',colorDomain)
            colorDomain.sort(function(a, b) { return a-b; });

            colorScale.domain([colorDomain[0], colorDomain[colorDomain.length-1]]);

            colorScale.range(colorRange[Math.min(11, colorDomain.length)]);
        }
    }

    function pushUnique(array, value) {
        if (array.indexOf(value) === -1 && value !== 0) {
            array.push(value);
        }
    }

    this.triptableMap = triptableMap;
})()