(function() {
	var overviewmap = {};

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
		tractsAreas = {};

	var currentCategory;

	var ACSdata;

	var dataDomain = {
		byCount: true,
		byDensity: false
	}

	var colorScale = d3.scale.quantize()
		.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

	overviewmap.init = function(svgID, input_tracts, acs_data, callback) {
		tractsGeoIDs = input_tracts;
		ACSdata = acs_data;

		var temp = d3.select(svgID);

		height = parseInt(temp.attr('height')) - margin.top;
		width = parseInt(temp.attr('width'));

		svg = temp.append('g')
			.attr('transform', 'translate(0, '+margin.top+')');

		legendGroup = temp.append('g');

		projection = d3.geo.albers()
			.translate([width/2, height/2]);

		path = d3.geo.path()
			.projection(projection);

        d3.json('/data/tracts.json', function(error, data) {
            data.features.forEach(function(feat){
                if(input_tracts.indexOf(feat.properties.geoid) !== -1){
                   	MAtracts.features.push(feat);
                   	tractsAreas[feat.properties.geoid] = path.area(feat);
                }
            })

			callback();
        })

		console.log('finished initializing overview map');
	}

	overviewmap.draw = function() {
		zoomToBounds(MAtracts);

		svg.selectAll('path')
			.data(MAtracts.features)
			.enter().append('path')
			.attr('class', 'ma-tract')
			.attr('d', path);

		var buttonWidth = 75,
			buttonHeight = 30;

		svg.append('g')
			.datum({ byCount: true, byDensity: false })
			.on('click', toggleDataDomain)
			.call(function(g) {
				g.append('rect')
					.attr('id', 'acs-button-byCount')
					.attr('class', 'acs-button')
					.attr('x', 10)
					.attr('y', 10)
					.attr('width', buttonWidth)
					.attr('height', buttonHeight);

				g.append('text')
					.attr('x', 10 + buttonWidth/2)
					.attr('y', 10 + buttonHeight/2)
					.text('By Count')
					.style('fill', '#00')
					.style('text-anchor', 'middle');
			})

		svg.append('g')
			.datum({ byCount: false, byDensity: true })
			.on('click', toggleDataDomain)
			.call(function(g) {
				g.append('rect')
					.attr('id', 'acs-button-byDensity')
					.attr('class', 'acs-button')
					.attr('x', 10)
					.attr('y', 40)
					.attr('width', buttonWidth)
					.attr('height', buttonHeight);

				g.append('text')
					.attr('x', 10 + buttonWidth/2)
					.attr('y', 10 + buttonHeight + buttonHeight/2)
					.text('By Density')
					.style('fill', '#00')
					.style('text-anchor', 'middle');
			})

		toggleDataDomain({ byCount: true, byDensity: false });
	}

	function toggleDataDomain(data) {
		dataDomain = data;

		for (var key in data) {
			d3.select('#acs-button-'+key).classed('acs-button-active', data[key]);
		}

		overviewmap.color(currentCategory);
	}

	overviewmap.color = function(category) {
		currentCategory = category;

		var domain = [];

		tractsGeoIDs.forEach(function(geoid) {
			var value = +ACSdata[geoid][category];

			if (dataDomain.byDensity) {
				value /= tractsAreas[geoid];
			}
			domain.push(value);
		})

		domain.sort(function(a, b) { return a-b; });

		colorScale.domain([domain[0], domain[domain.length-1]]);

		svg.selectAll('path')
			.classed('ma-active', true)
			.style('fill', function(d) {
				if (dataDomain.byDensity) {
					return colorScale(ACSdata[d.properties.geoid][category]/tractsAreas[d.properties.geoid]);
				}
				return colorScale(ACSdata[d.properties.geoid][category]);
			})

		drawLegend();
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

	this.overviewmap = overviewmap;
})()