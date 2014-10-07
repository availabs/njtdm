(function() {
	var acsmap = {};

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

	var currentGroup,
		currentCategory;

	var ACSdata,
		ACSgroups,
		categoryNames = {};

	var dataDomain = {
		byCount: true,
		byDensity: false
	}

	var popup,
		table;

	var colorScale = d3.scale.quantize()
		.range(["#313695", "#4575b4", "#74add1", "#abd9e9", "#e0f3f8", "#ffffbf", "#fee090", "#fdae61", "#f46d43", "#d73027", "#a50026"]);

	acsmap.init = function(svgID, input_tracts, acs_data, callback) {
		tractsGeoIDs = input_tracts;

		ACSdata = acs_data.acs;
		ACSgroups = acs_data.categories;

		for (var key in acs_data.census_vars) {
			categoryNames[key] = acs_data.census_vars[key].name;
		}

		var temp = d3.select(svgID);

		height = parseInt(temp.attr('height')) - margin.top;
		width = parseInt(temp.attr('width'));

		popup = d3.select('#map')
			.append('div')
			.attr('id', 'overview-popup')

		table = popup.append('table')
			.attr('class', 'table table-striped table-condensed')
			
		table.append('thead').append('tr').append('th').attr('colspan','2')
		
		table.append('tbody')

		popup.select('table')

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
	}

	function showPopup(d) {
		var tractTotal = ACSgroups[currentGroup].map(function(cat) { return ACSdata[d.properties.geoid][cat]; }).reduce(function(p, c) { return p+c; }, 0),
			format = d3.format('>,.1%');

		popup.select('table').select('thead').select('tr').select('th').text('geoid:' + d.properties.geoid);

		var rows = popup.select('table').select('tbody')
			.selectAll('tr')
			.data(ACSgroups[currentGroup])

		rows.exit().remove();

		rows.enter().append('tr');

		rows.each(function(cat) {
			var row = d3.select(this);

			row.selectAll('*').remove();

			row.append('td')
				.text(categoryNames[cat]);

			row.append('td')
				.text(format(ACSdata[d.properties.geoid][cat]/tractTotal));

			row.append('td')
				.text(ACSdata[d.properties.geoid][cat]);
		})

		popup.style('display', 'block')
	}

	function movePopup() {
		var x = d3.event.x,
			y = d3.event.y;

		var el = popup.node(),
			wdth = el.offsetWidth,
			hght = el.offsetHeight;

		var width = window.innerWidth,
			height = window.innerHeight;

		var position = {
			right: 'auto',
			left: 'auto',
			top: 'auto',
			bottom: 'auto'
		}

		if (x + wdth > width) {
			position.left = (x-wdth-10)+'px';
		}
		else {
			position.left = (x+10)+'px';
		}

		if (y + hght > height) {
			position.top = (y-hght-10)+'px';
		}
		else {
			position.top = (y+10)+'px';
		}

		popup.style(position)
	}

	function hidePopup() {
		popup.style('display', 'none')
	}

	acsmap.draw = function() {
		zoomToBounds(MAtracts);

		svg.selectAll('path')
			.data(MAtracts.features)
			.enter().append('path')
			.attr('class', 'ma-tract')
			.attr('d', path)
			.on('mouseover', showPopup)
			.on('mousemove', movePopup)
			.on('mouseout', hidePopup);

		var buttonWidth = 75,
			buttonHeight = 30;

		var data = [
			{text: 'By Count', domain: { byCount: true, byDensity: false, byPercent: false }, id: 'byCount'},
			{text: 'By Density', domain: { byCount: false, byDensity: true, byPercent: false }, id: 'byDensity'},
			{text: 'By Percent', domain: { byCount: false, byDensity: false, byPercent: true }, id: 'byPercent'}
		]

		svg.selectAll('.acs-button-group')
			.data(data)
			.enter().append('g')
			.attr('class', function(d) { return 'acs-button-group'; })
			.on('click', toggleDataDomain)
			.each(function(d, i) {
				var g = d3.select(this);

				g.append('rect')
					.attr('id', function() { return 'acs-button-'+d.id; })
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

		d3.select('.acs-button-group').each(toggleDataDomain);
	}

	function toggleDataDomain(data) {
		dataDomain = data.domain;

		for (var key in dataDomain) {
			d3.select('#acs-button-'+key).classed('acs-button-active', dataDomain[key]);
		}

		acsmap.color(currentCategory, currentGroup);
	}

	acsmap.color = function(category, group) {
		currentCategory = category;
		currentGroup = group;

		var domain = [],
			domainMap = {};

		tractsGeoIDs.forEach(function(geoid) {
			var value = +ACSdata[geoid][category];

			if (dataDomain.byDensity) {
				value /= tractsAreas[geoid];
			}
			else if (dataDomain.byPercent) {
				var tractTotal = ACSgroups[currentGroup].map(function(cat) { return ACSdata[geoid][cat]; }).reduce(function(p, c) { return p+c || p }, 0);

				//console.log('tractTotal',tractTotal);
				if (tractTotal === 0) {
					value = 0;
				}
				else {
					value = (value/tractTotal)*100 || 0;
					console.log(value);
				}
			}

			if (!(value in domainMap)) {
				domain.push(value);
			}

			domainMap[value] = true;
		})
		domain.sort(function(a, b) { return a-b; });
		colorScale.domain([domain[0], domain[domain.length-1]]);

		svg.selectAll('path')
			.classed('ma-active', true)
			.style('fill', function(d) {
				if (dataDomain.byDensity) {
					return colorScale(ACSdata[d.properties.geoid][category]/tractsAreas[d.properties.geoid]);
				}
				else if (dataDomain.byPercent) {
					var tractTotal = ACSgroups[currentGroup].map(function(cat) { return ACSdata[d.properties.geoid][cat]; }).reduce(function(p, c) { return p+c; }, 0);
					return colorScale(ACSdata[d.properties.geoid][category]/tractTotal*100);
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

            k = Math.min(width/wdth, height/hght)*.95,
            scale = projection.scale()*k;

        var centroid = [(bounds[1][0]+bounds[0][0])/2, (bounds[1][1]+bounds[0][1])/2]//,
            translate = projection.translate();

        projection.scale(scale)
        	.translate([translate[0]*k - centroid[0]*k + width / 2,
                        translate[1]*k - centroid[1]*k + height / 2]);
    }

	this.acsmap = acsmap;
})()