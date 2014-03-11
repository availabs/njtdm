SELECT a.trip_id,
a.duration,
a.distance,
a.route,
a.on_stop_code,
a.gtfs_trip_id,
a.off_stop_code,
b.start_time,
b.waiting_time,
b.walk_distance,
b.walking_time,	
c.arrival_time,	
d.arrival_time as trip_start_time,
f.fare_zone as on_fare_zone,
g.fare_zone as off_fare_zone 
from model_legs a 
	join model_trips b 
		ON a.trip_id = b.id 
	join "njtransit_bus_07-12-2013".stop_times c 
		ON a.on_stop_id = c.stop_id and a.gtfs_trip_id = c.trip_id 
	join fare_zones f 
		on f.stop_num = a.on_stop_code and f.line = a.route
	join fare_zones g 
		on g.stop_num = a.off_stop_code and g.line = a.route 
	join "njtransit_bus_07-12-2013".stop_times d 
		ON d.stop_sequence = 1 and a.gtfs_trip_id = d.trip_id 
where a.run_id = 36
	and mode = 'BUS' and g.fare_zone like 'P%'
	and (d.arrival_time like '06%' or  d.arrival_time like '07%' or d.arrival_time like '08%' or d.arrival_time like '09%') 
	and a.route in ('319','501','502','504','505','507','508','509','551','552','553','554','559');