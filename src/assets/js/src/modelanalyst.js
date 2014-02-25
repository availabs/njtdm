modelAnalyst = {
	modelTrips : [],
	modelRoute : {},
	modelRoutesGroup : {},
	update_data:function(data){
		modelAnalyst.modelTrips = crossfilter(data);
		modelRoutes = modelAnalyst.modelTrips.dimension(function(d){return d.route;});
		modelRoutesGroup = modelRoutes.group(function(d){return d;});
		return {"routes":modelRoutesGroup};
	}
};