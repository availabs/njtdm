var routemap = function() {
	var svg,
		width,
		height,
		projection,
		path;

	function map(svgID) {
		width = 500;
		height = 500;

		var svg = d3.select(svgID)
			.attr('width', width)
			.attr('height', height)

		projection = d3.geo.projection;

		path = d3.geo.path()
			.projection(projection);
	}
	map.drawRoute = function(route) {
		
	}

	function zoomToBounds(json) {
        var bounds = path.bounds(json),
            wdth = bounds[1][0] - bounds[0][0],
            hght = bounds[1][1] - bounds[0][1],

            k = Math.min(width/wdth, height/hght),
            scale = projection.scale()*k*0.95;

        projection.scale(scale);

        bounds = path.bounds(json);

        var centroid = [(bounds[1][0]+bounds[0][0])/2, (bounds[1][1]+bounds[0][1])/2],
            translate = projection.translate();

        projection.translate([translate[0] - centroid[0] + width / 2,
                             translate[1] - centroid[1] + height / 2]);
	}

	return map;
}