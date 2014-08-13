(function() {
	var njmap = {};

	njmap.init = function(svgID) {
		var svg = d3.select(svgID),
			width = parseInt(svg.style('width'));

		svg.style('height', width+'px');

		console.log("???");
	}

	this.njmap = njmap;
})()