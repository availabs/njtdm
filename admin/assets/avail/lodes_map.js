(function() {
	var lodesmap = {};

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
		};

	var colorRange = {
		1: ["#ffffbf"].reverse(),
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
		//.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

	lodesmap.init = function(svgID, input_tracts) {
		tractsGeoIDs = input_tracts;

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

        d3.json('/data/tracts.json', function(error, tractData) {
            tractData.features.forEach(function(feat){
                if(tractsGeoIDs.indexOf(feat.properties.geoid) !== -1){
                   	MAtracts.features.push(feat);
                }
            })
            lodesmap.draw();

			reset();
        })

		console.log('finished initializing ctpp map');
	}

	lodesmap.draw = function() {
		zoomToBounds(MAtracts);

		svg.selectAll('path')
			.data(MAtracts.features)
			.enter().append('path')
			.attr('id', function(d) { return 'tract-'+d.properties.geoid; })
			.attr('class', 'ctpp-tract')
			.attr('d', path)
			.on('click', clicked);
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
        var rows = d3.select("#lodes-table").select('tbody')
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
	}

	function highlightTract(d) {
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

        var temp = svg.selectAll('#temp-'+d.properties.geoid)
        	.data([d]).enter().append('path')
        	.attr('id', 'temp-'+d.properties.geoid)
			.attr('class', 'ctpp-tract temp-tract')
			.style('fill', function(d) { return d3.select('#tract-'+d.properties.geoid).style('fill'); })
			.attr('d', path)

		temp
			.transition()
			.duration(500)
			.attr('d', pth)
			.style('fill', '#080')
	}

	function unhighlightTract(d) {
		d3.select('#temp-'+d.properties.geoid)
			.transition()
			.duration(250)
			.attr('d', path)
			.each('end', function() { d3.select(this).remove(); })
	}

	function reset() {
		d3.json('/marketarea/2/lodes_start_data', function(error, data) {

			var colorDomain = [];

            MAtracts.features.forEach(function(d, i) {
                MAtracts.features[i].properties.numTrips = data[d.properties.geoid] || 0;
                pushUnique(colorDomain, data[d.properties.geoid] || 0);
            })

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

			clickedTract = null;
		})
	}

	var clickedTract = null;

	function clicked(d) {
		if (d.properties.numTrips === 0 || d === clickedTract) {
			reset();
			return;
		}
		clickedTract = d;

		d3.selectAll('.temp-tract').remove();

		var tracts = svg.selectAll('path')
			.style('fill', null)
			.classed('ctpp-tract-active', false);

		d3.select(this)
			.classed('ctpp-tract-active', true);

		d3.json('/marketarea/'+d.properties.geoid+'/lodes_travel_data', function(error, data) {
			var toTracts = {},
				colorDomain = [];

            var tableData = [];
				
			data.forEach(function(d) {
				pushUnique(colorDomain, d.amount);
				toTracts[d.geoid] = d.amount;

				obj = {properties: {geoid: d.geoid}}
				tableData.push(obj);
			})

            setColorScale(colorDomain)

			tracts.filter(function(d) { return (d.properties.geoid in toTracts); })
				.style('fill', function(d) { return colorScale(toTracts[d.properties.geoid]); })

			populateCTPPtable(tableData, toTracts);

			drawLegend();
		})
	}

	function pushUnique(array, value) {
		if (array.indexOf(value) === -1 && value !== 0) {
			array.push(value);
		}
	}

    function zoomToBounds(collection) {
        var bounds = path.bounds(collection),
            wdth = bounds[1][0] - bounds[0][0],
            hght = bounds[1][1] - bounds[0][1],

            k = Math.min(width/wdth, height/hght),
            scale = projection.scale()*k*0.95;

        projection.scale(scale);

        var centroid = path.centroid(collection),
            translate = projection.translate();

        projection.translate([translate[0] - centroid[0] + width / 2,
                             translate[1] - centroid[1] + height / 2]);
    }

	this.lodesmap = lodesmap;
})()