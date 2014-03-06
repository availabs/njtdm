modelAnalyst = {
	modelTrips : [],
	modelRoute : {},
	modelRoutesGroup : {},
	modelOnStop : {},
	modelOnStopGroup : {},
	modelOffStop : {},
	modelOffStopGroup : {},
	modelTripCount : {},
	modelTripCountGroup : {},
	update_data:function(data){
		var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.000Z");
		data.forEach(function(d){
			d.start_time_d = timeFormat.parse(d.start_time);
			d.minute = d3.time.minute(d.start_time_d);
			console.log(d.minute);
			d.minute.setHours(d.minute.getHours()-4);

		})
		console.log('model analyst data', data);
		modelAnalyst.modelTrips = crossfilter(data);

		modelRoutes = modelAnalyst.modelTrips.dimension(function(d){return d.route;});
		modelRoutesGroup = modelRoutes.group(function(d){return d;});

		modelOnStop = modelAnalyst.modelTrips.dimension(function(d){return d.on_stop_code;});
		modelOnStopGroup = modelOnStop.group(function(d) {return d});

		modelOffStop = modelAnalyst.modelTrips.dimension(function(d){return d.off_stop_code;});
		modelOffStopGroup = modelOffStop.group(function(d) {return d;});

		modelAnalyst.modelTripCount= modelAnalyst.modelTrips.dimension(function(d){return d.trip_id;});
		modelAnalyst.modelTripCountGroup = modelAnalyst.modelTripCount.group(function(d) {return d;});

		var transfer_counts = crossfilter(modelAnalyst.modelTripCountGroup.all())
				.dimension(function(d){return d.value-1;}).group().all();

		//var startMinuteDimension = modelAnalyst.modelTrips.dimension(function(d){console.log(d);return d.minute;});
		//console.log(startMinuteDimension.group().all());



		return {"routes":modelRoutesGroup,"on_stops":modelOnStopGroup,"off_stops":modelOffStopGroup, "transfer_counts":transfer_counts};//,startTimeGroup:"countPerMinute"};
	}
};