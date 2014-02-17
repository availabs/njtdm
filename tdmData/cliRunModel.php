<?php
 $dbh = pg_connect("host=localhost dbname=tdmData user=postgres");

 $sql = "SELECT trips FROM triptable where id = ".$argv[1];
 $result = pg_query($dbh, $sql);
 $row = pg_fetch_array($result);
 $trips = json_decode($row['trips'],true);
 $model = array();
 $model['successful_trips'] = array();
 $model['failed_trips'] = array();
 foreach($trips as $trip){
 	//print_r($trip['from_coords']);
 	planTrip($trip['from_coords'][0],$trip['from_coords'][1],$trip['to_coords'][0],$trip['to_coords'][1],$trip['time'],$trip);
 }
 echo json_encode($model);
 echo "FINISHED";
 

function  planTrip($from_lat,$from_lon,$to_lat,$to_lon,$departure_time,$trip){
	

	$otp_url = "http://localhost:8080/opentripplanner-api-webapp/ws/plan?";
	$otp_url .= "fromPlace=$from_lat,$from_lon";
	$otp_url .= "&toPlace=$to_lat,$to_lon";
	$otp_url .= "&mode=TRANSIT,WALK";
  	$otp_url .= "&min=QUICK";
  	$otp_url .= "&maxWalkDistance=800";
  	$otp_url .= "&walkSpeed=1.341";
  	$otp_url .= "&time=$departure_time";
  	$otp_url .= "&date=7/23/2013";
  	$otp_url .= "&arriveBy=false";
  	$otp_url .= "&itinID=1";
  	$otp_url .= "&wheelchair=false";
  	$otp_url .= "&preferredRoutes=";
  	$otp_url .= "&unpreferredRoutes=";
  	
  	//echo $otp_url.'<br>';
  // 	//echo 'Running trip at: time:'.rand($this->start_hour,$this->end_hour).':'.rand(0,59).'am<br><br>';

  processTrip(json_decode(curl_download($otp_url),true),$trip);
}

function processTrip($data,$trip_input){

	global $model;	
	if(count($data['plan']['itineraries']) > 0){
		array_push($model['successful_trips'],$data['plan']['itineraries'][rand(0,count($data['plan']['itineraries'])-1)]);
	}else{

		array_push($model['failed_trips'],$trip_input);
	}
}

function curl_download($Url){ 
    // is cURL installed yet?
    if (!function_exists('curl_init')){
        die('Sorry cURL is not installed!');
    }
 
  	// OK cool - then let's create a new cURL resource handle
  	
   	$ch = curl_init();
   	$headers = array('Accept: application/json');
   	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers); 
	//curl_setopt($ch, CURLOPT_HEADER, 1); 
   	curl_setopt($ch, CURLOPT_URL, $Url);
   	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
   	$output = curl_exec($ch);

    return $output;
}