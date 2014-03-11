modelAnalyst = {
	modelTrips : [],
	modelBadTrips : [],
	modelRoute : {},
	modelRoutesGroup : {},
	modelOnStop : {},
	modelOnStopGroup : {},
	modelOffStop : {},
	modelOffStopGroup : {},
	modelTripCount : {},
	modelTripCountGroup : {},
	update_data:function(data,i){
		var timeFormat = d3.time.format("%Y-%m-%dT%H:%M:%S.000Z");
		data.forEach(function(d){
			d.start_time_d = timeFormat.parse(d.start_time);
			d.minute = d3.time.minute(d.start_time_d);
			d.minute.setHours(d.minute.getHours()-4);
		});
		modelAnalyst.modelBadTrips = [];
		for (var i = data.length-1; i >= 0; i--) {
			if (data[i].waiting_time <= 3)
				data[i].waiting_time = 0;

			if (data[i].waiting_time > 1200) {
				modelAnalyst.modelBadTrips.push(data[i]);
				data = data.slice(0, i).concat(data.slice(i+1));
			}
		}
		//console.log('model analyst data', data);
		modelAnalyst.modelTrips = crossfilter(data);

		modelRoutes = modelAnalyst.modelTrips.dimension(function(d){return d.route;});
		modelRoutesGroup = modelRoutes.group(function(d){return d;});

		modelOnStop = modelAnalyst.modelTrips.dimension(function(d){return d.on_stop_code;});
		modelOnStopGroup = modelOnStop.group(function(d) {return d});

		modelOffStop = modelAnalyst.modelTrips.dimension(function(d){return d.off_stop_code;});
		modelOffStopGroup = modelOffStop.group();

		modelAnalyst.modelTripCount= modelAnalyst.modelTrips.dimension(function(d){return d.trip_id;});
		modelAnalyst.modelTripCountGroup = modelAnalyst.modelTripCount.group();

		var transfer_counts = crossfilter(modelAnalyst.modelTripCountGroup.all())
				.dimension(function(d){return d.value-1;}).group();

		var startMinuteDimension = modelAnalyst.modelTrips.dimension(function(d){return d.minute;}),
			startTimeGroup = startMinuteDimension.group();

		var waitTimeDimension = modelAnalyst.modelTrips.dimension(function(d){return Math.round(d.waiting_time/60);}),
			waitTimeGroup = waitTimeDimension.group();

		return {"routes": modelRoutesGroup, "on_stops": modelOnStopGroup,
				"off_stops": modelOffStopGroup, "transfer_counts": transfer_counts,
				"start_time_group": startTimeGroup, "wait_time_group": waitTimeGroup,
				"model_bad_trips" : modelAnalyst.modelBadTrips};
	}
};