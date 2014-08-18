(function() {
	var ctppmap = {};

	var svg,
		height,
		width;

	var projection,
		path;

	var tractsGeoIDs = [],
		MAtracts = {
			type: "FeatureCollection",
			features: []
		};

	var colorScale = d3.scale.quantize()
		.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

	ctppmap.init = function(svgID, input_tracts) {
		tractsGeoIDs = input_tracts;

		svg = d3.select(svgID);

		height = parseInt(svg.attr('height'));
		width = parseInt(svg.attr('width'));

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
            ctppmap.draw();

			reset();
        })

		console.log('finished initializing ctpp map');
	}

	ctppmap.draw = function() {
		zoomToBounds(MAtracts);

		svg.selectAll('path')
			.data(MAtracts.features)
			.enter().append('path')
			.attr('class', 'ctpp-tract')
			.attr('d', path)
			.on('click', clicked);
	}

	function reset() {
		d3.json('/marketarea/2/ctpp_start_data', function(error, data) {

			var colorDomain = [];

			MAtracts.features.forEach(function(d, i) {
                MAtracts.features[i].properties.numTrips = data[d.properties.geoid] || 0;
                colorDomain.push(data[d.properties.geoid] || 0);
            })

            colorScale.domain(d3.extent(colorDomain));

			svg.selectAll('path')
				.classed('ctpp-tract-active', false)
				.style('fill', function(d) {
					if (d.properties.numTrips === 0) {
						return null;
					}
					return colorScale(d.properties.numTrips);
				})
		})
	}

	function clicked(d) {
		var tracts = svg.selectAll('path')
			.style('fill', null)
			.classed('ctpp-tract-active', false);

		d3.select(this)
			.classed('ctpp-tract-active', true);

		d3.json('/marketarea/'+d.properties.geoid+'/ctpp_travel_data', function(error, data) {
			var toTracts = {},
				domain = [];

			data.forEach(function(d2) {
				domain.push(d2.est);
				toTracts[d2.geoid] = d2.est;
			})

			colorScale.domain(d3.extent(domain));

			tracts.filter(function(d2) { return (d2.properties.geoid in toTracts); })
				.style('fill', function(d) { return colorScale(toTracts[d.properties.geoid]); });
		})
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

	this.ctppmap = ctppmap;
})()