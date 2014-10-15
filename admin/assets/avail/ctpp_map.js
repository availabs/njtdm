(function() {
	var ctppmap = {};

	var svg,
		height,
		width;

	var margin = {top: 30};

	var legendGroup;

	var projection,
		path;

	var tractsGeoIDs = [],
		MAtracts = {
			type: "FeatureCollection",
			features: []
		},
		tractFeatures = {};

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

	ctppmap.init = function(svgID, marketArea) {
		//tractsGeoIDs = input_tracts;

		var temp = d3.select(svgID);

		height = parseInt(temp.attr('height')) - margin.top;
		width = parseInt(temp.attr('width'));

		svg = temp.append('g')
			.attr('transform', 'translate(0, '+margin.top+')');

		legendGroup = temp.append('g');

		svg.append('rect')
			.attr('width', width)
			.attr('height', height)
			.attr('fill', '#fff')
			.on('click', reset);

		projection = d3.geo.albers()
			.translate([width/2, height/2]);

		path = d3.geo.path()
			.projection(projection);

        MAtracts = marketArea.geoData;
	    tractsAreas = marketArea.tractFeatures;
		
		Object.keys(tractsAreas).map(function(d){
			tractsGeoIDs.push(d);
		});
        
        ctppmap.draw();

		reset();
       
	}

	ctppmap.draw = function() {
		zoomToBounds(MAtracts);

		svg.selectAll('path')
			.data(MAtracts.features)
			.enter().append('path')
			.attr('id', function(d) { return 'ctpp-tract-'+d.properties.geoid; })
			.attr('class', 'ctpp-tract')
			.attr('d', path)
			.on('click', clicked);

		var buttonWidth = 75,
			buttonHeight = 30;

		var data = [
			{text: 'To Work', id: 'outbound'},
			{text: 'To Home', id: 'inbound'}
		]

		svg.selectAll('.ctpp-button-group')
			.data(data)
			.enter().append('g')
			.attr('class', 'ctpp-button-group')
			.on('click', toggleCTPPbuttons)
			.each(function(d, i) {
				var g = d3.select(this);

				g.append('rect')
					.attr('id', function() { return 'ctpp-button-'+d.id; })
					.attr('class', 'acs-button')
					.attr('y', function() { return 10 + buttonHeight*i; })
					.attr('width', buttonWidth)
					.attr('height', buttonHeight);

				g.append('text')
					.attr('x', buttonWidth/2)
					.attr('y', function() { return 10 + buttonHeight*i + buttonHeight/2; })
					.text(function() { return d.text; })
					//.style('fill', '#000')
					.style('text-anchor', 'middle');
			})

		d3.select('.ctpp-button-group').each(toggleCTPPbuttons);
	}

	function toggleCTPPbuttons(data) {
		d3.selectAll('.ctpp-button-group')
			.select('rect')
			.classed('acs-button-active', function(d, i) {
				return 'ctpp-button-'+data.id == d3.select(this).attr('id');
			});

		trafficType = data.id;

		if (!clickedTract) {
			reset();
		}
		else {
			clicked(null);
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

		colorDomain.sort(function(a, b) { return a-b; })

		colorScale.domain([colorDomain[0], colorDomain[colorDomain.length-1]]);

        colorScale.range(colorRange[Math.min(11, colorDomain.length)]);

	}

	function populateCTPPtable(data, map) {
		data.sort(function(a, b) {
			var c = map[a.properties.geoid] || 0,
				d = map[b.properties.geoid] || 0;

			return d-c;
		})
        var rows = d3.select("#ctpp-table").select('tbody')
        	.selectAll('tr').data(data);

        rows.exit().remove();

        rows.enter().append('tr');

        rows.each(function(d, i) {
        	var row = d3.select(this);

        	row.selectAll('*').remove();

        	row.append('td')
        		.text(d.properties.geoid);

        	row.append('td')
        		.text(map[d.properties.geoid] || 0);
        })
        .on('click', clicked)
        .on('mouseover', highlightTract)
        .on('mouseout', unhighlightTract);

        if (clickedTract) {
        	var header = d3.select("#ctpp-table").select('tbody').insert('tr', ":first-child");
        	
	        header.append('td')
	        	.text('Selected Tract geoID:')
	        header.append('td')
	        	.text(clickedTract.properties.geoid)
	    }
	}

	function highlightTract(d) {
		if (!(d.properties.geoid in tractFeatures)) {
			return;
		}
		var bounds = path.bounds(d);

		var center = [(bounds[0][0]+bounds[1][0]) / 2, (bounds[0][1]+bounds[1][1]) / 2];

		var w = bounds[1][0] - bounds[0][0],
			h = bounds[1][1] - bounds[0][1];

		var proj = d3.geo.albers()
			.translate(projection.translate())
			.scale(projection.scale()),

			pth = d3.geo.path()
				.projection(proj);

		var min = 100;

		var zoom = Math.max(2, Math.min(min / w, min / h));

		var targetZoom = Math.round(projection.scale() * zoom),
            translate = projection.translate(),
            translate0 = [],
            l = [],
            view = {
                x: translate[0],
                y: translate[1],
                k: projection.scale()
            };

        translate0 = [(center[0]-view.x)/view.k, (center[1]-view.y)/view.k];

        view.k = targetZoom;

        l = [translate0[0]*view.k+view.x, translate0[1]*view.k+view.y];

        view.x += center[0]-l[0];
        view.y += center[1]-l[1];

        proj.scale(view.k)
            .translate([view.x, view.y]);

        var temp = svg.selectAll('#ctpp-temp-'+d.properties.geoid)
        	.data([d]).enter().append('path')
        	.attr('id', 'ctpp-temp-'+d.properties.geoid)
			.attr('class', 'ctpp-tract temp-tract')
			.style('fill', function(d) { return d3.select('#ctpp-tract-'+d.properties.geoid).style('fill'); })
			.attr('d', path)

		temp
			.transition()
			.duration(500)
			.attr('d', pth)
			.style('fill', '#080')
	}

	function unhighlightTract(d) {
		if (!(d.properties.geoid in tractFeatures)) {
			return;
		}
		d3.select('#ctpp-temp-'+d.properties.geoid)
			.transition()
			.duration(250)
			.attr('d', path)
			.each('end', function() { d3.select(this).remove(); })
	}

	function reset() {
		d3.json('/marketarea/'+trafficType+'/all_ctpp_data', function(error, data) {

			var colorDomain = [];

            MAtracts.features.forEach(function(d, i) {
                MAtracts.features[i].properties.numTrips = data[d.properties.geoid] || 0;
                pushUnique(colorDomain, data[d.properties.geoid] || 0);
            })

			clickedTract = null;

            populateCTPPtable(MAtracts.features, data);

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
		})
		svg.selectAll('.temp-tract').remove();
	}

	var clickedTract = null;

	function clicked(d) {
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

		d3.json('/marketarea/'+clickedTract.properties.geoid+'/'+trafficType+'/ctpp_travel_data', function(error, data) {
			var toTracts = {},
				colorDomain = [];

            var tableData = [];
				
			data.forEach(function(d) {
				pushUnique(colorDomain, d.est);
				toTracts[d.geoid] = d.est;

				var obj = {properties: {geoid: d.geoid}}
				tableData.push(obj);
				// if (d.geoid in tractFeatures) {
				// 	tableData.push(tractFeatures[d.geoid]);
				// }
				// else {
				// 	tableData.push({properties: {geoid: d.geoid }});
				// }
			})

            setColorScale(colorDomain)

			tracts.filter(function(d) { return (d.properties.geoid in toTracts); })
				.style('fill', function(d) { return colorScale(toTracts[d.properties.geoid]); })

			populateCTPPtable(tableData, toTracts);

			drawLegend();
		})
	}

	function pushUnique(array, value) {
		if (array.indexOf(value) === -1) {//} && value !== 0) {
			array.push(value);
		}
	}

    function zoomToBounds(collection) {
        var bounds = path.bounds(collection),
            wdth = bounds[1][0] - bounds[0][0],
            hght = bounds[1][1] - bounds[0][1],

            k = Math.min(width/wdth, height/hght)*.95,
            scale = projection.scale()*k;

        var centroid = [(bounds[1][0]+bounds[0][0])/2, (bounds[1][1]+bounds[0][1])/2]//,
            translate = projection.translate();

        projection.scale(scale)
        	.translate([translate[0]*k - centroid[0]*k + width / 2,
                        translate[1]*k - centroid[1]*k + height / 2]);
    }

	this.ctppmap = ctppmap;
})()