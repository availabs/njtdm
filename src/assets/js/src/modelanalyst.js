modelAnalyst = {
	modelTrips : [],
	modelRoute : {},
	modelRoutesGroup : {},
	modelOnStop : {},
	modelOnStopGroup : {},
	modelOffStop : {},
	modelOffStopGroup : {},
	update_data:function(data){
		//console.log(data);
		modelAnalyst.modelTrips = crossfilter(data);
		modelRoutes = modelAnalyst.modelTrips.dimension(function(d){return d.route;});
		modelRoutesGroup = modelRoutes.group(function(d){return d;});

		modelOnStop = modelAnalyst.modelTrips.dimension(function(d){return d.on_stop_code;});
		modelOnStopGroup = modelOnStop.group(function(d) {return d});

		modelOffStop = modelAnalyst.modelTrips.dimension(function(d){return d.off_stop_code;});
		modelOffStopGroup = modelOffStop.group(function(d) {return d;});

		return {"routes":modelRoutesGroup,"on_stops":modelOnStopGroup,"off_stops":modelOffStopGroup};
	}
};