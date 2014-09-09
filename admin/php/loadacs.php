<?php 

echo "status:Initializing";
ini_set("memory_limit","1024M");
ini_set('max_execution_time', 600);
$conn_string = "host=lor.availabs.org port=5432 dbname=geocensus user=postgres password=transit";
$inscon = pg_connect($conn_string);
//$inscon = $test->connect();


$sql = 'SELECT geoid from "tl_2013_'.$argv[6].'_tract" as a';

$rs = pg_query($sql) or die($sql." ".pg_error());
$num_rows =  pg_num_rows ($rs);
//echo "num rows:$num_rows";

$sources = Array('sf1','acs5');
$handles = Array( 'sf1' =>Array('P0010001','P0030002','P0030003','P0030005'),'acs5' => Array('B23025_001E','B23025_002E','B08006_001E','B08006_002E','B08006_003E','B08006_004E','B08006_008E'));

$var_sets =  Array();
$push_set = Array('B01003_001E','B12006_001E','B12006_005E','B12006_010E','B12006_016E','B12006_021E','B12006_027E','B12006_032E','B12006_038E','B12006_043E','B12006_049E','B12006_054E','B12006_006E','B12006_011E','B12006_017E','B12006_022E','B12006_028E','B12006_033E','B12006_039E');
array_push($var_sets,$push_set);
$push_set = Array('B12006_044E','B12006_050E','B12006_055E','B08301_001E','B08301_002E','B08301_010E','B08301_016E','B08301_017E','B08301_018E','B08301_019E','B08301_020E','B08301_021E','B08301_011E','B08301_013E','B08301_014E','B08126_001E','B08126_002E','B08126_003E','B08126_004E');
array_push($var_sets,$push_set);
$push_set = Array('B08126_005E','B08126_006E','B08126_007E','B08126_008E','B08126_009E','B08126_010E','B08126_011E','B08126_012E','B08126_013E','B08126_014E','B08126_015E','B19001_005E','B19001_006E','B19001_007E','B19001_008E','B19001_009E','B19001_010E','B19001_011E','B19001_012E');
array_push($var_sets,$push_set);
$push_set = Array('B19001_013E','B19001_014E','B19001_015E','B19001_016E','B19001_017E','B19013_001E','B17001_002E','B14003_003E','B14003_012E','B14003_031E','B14003_040E','B23006_002E','B23006_009E','B23006_016E','B23006_023E','B05006_001E','B06007_005E','B06007_008E','B01001_002E');
array_push($var_sets,$push_set);
$push_set = Array('B01001_026E','B01001_004E','B01001_005E','B01001_006E','B01001_007E','B01001_008E','B01001_009E','B01001_010E','B01001_011E','B01001_012E','B01001_013E','B01001_014E','B01001_015E','B01001_016E','B01001_017E','B01001_018E','B01001_019E','B01001_020E','B01001_021E');
array_push($var_sets,$push_set);
$push_set = Array('B01001_022E','B01001_023E','B01001_024E','B01001_025E','B01001_027E','B01001_028E','B01001_029E','B01001_030E','B01001_031E','B01001_032E','B01001_033E','B01001_034E','B01001_035E','B01001_036E','B01001_037E','B01001_038E','B01001_039E','B01001_040E','B01001_041E');
array_push($var_sets,$push_set);
$push_set = Array('B01001_042E','B01001_043E','B01001_044E','B01001_045E','B01001_046E','B01001_047E','B01001_048E','B01001_049E','B02001_002E','B02001_003E','B02001_004E','B02001_005E','B02001_006E','B02001_007E','B02001_008E','B25002_001E','B25002_002E','B25002_003E','B25024_002E');
array_push($var_sets,$push_set);
$push_set = Array('B25024_003E','B25024_004E','B25024_005E','B25024_006E','B25024_007E','B25024_008E','B25024_009E','B25024_010E','B25024_011E','B25003_002E','B25003_003E','B08014_002E','B08014_003E','B08014_004E','B08014_005E','B08014_006E','B08014_007E','B08132_002E','B08132_003E');
array_push($var_sets,$push_set);
$push_set = Array('B08132_004E','B08132_005E','B08132_006E','B08132_007E','B08132_008E','B08132_009E','B08132_010E','B08132_011E','B08132_012E','B08132_013E','B08132_014E','B08132_015E','B08132_046E','B08132_047E','B08132_048E','B08132_049E','B08132_050E','B08132_051E','B08132_052E');
array_push($var_sets,$push_set);
$push_set = Array('B08132_053E','B08132_054E','B08132_055E','B08132_056E','B08132_057E','B08132_058E','B08132_059E','B08132_060E','B08133_001E','B08133_002E','B08133_003E','B08133_004E','B08133_005E','B08133_006E','B08133_007E','B08133_008E','B08133_009E','B08133_010E','B08133_011E');
array_push($var_sets,$push_set);
$push_set = Array('B08133_012E','B08133_013E','B08133_014E','B08133_015E','B08122_001E','B08122_002E','B08122_003E','B08122_004E','B08122_005E','B08122_006E','B08122_007E','B08122_008E','B08122_009E','B08122_010E','B08122_011E','B08122_012E','B08122_013E','B08122_014E','B08122_015E');
array_push($var_sets,$push_set);
$push_set = Array('B08122_016E','B08122_017E','B08122_018E','B08122_019E','B08122_020E','B08122_021E','B08122_022E','B08122_023E','B08122_024E','B08122_025E','B08122_026E','B08122_027E','B08122_028E','B08136_001E','B08136_002E','B08136_003E','B08136_004E','B08136_005E','B08136_006E');
array_push($var_sets,$push_set);
$push_set = Array('B08136_007E','B08136_008E','B08136_009E','B08136_010E','B08136_011E','B08136_012E','B19001_001E','B19001_002E','B19001_003E','B19001_004E','B08126_046E','B08126_047E','B08126_048E','B08126_049E','B08126_050E','B08126_051E','B08126_052E','B08126_053E','B08126_054E');
array_push($var_sets,$push_set);
$push_set = Array('B08126_055E','B08126_056E','B08126_057E','B08126_058E','B08126_059E','B08126_060E','B08519_001E','B08519_002E','B08519_003E','B08519_004E','B00002_001E');
array_push($var_sets,$push_set);
$push_set = Array('B08519_005E','B08519_006E','B08519_007E','B08519_008E','B08519_009E','B08519_028E','B08519_029E','B08519_030E','B08519_031E','B08519_032E','B08519_033E','B08519_034E','B08519_035E','B08519_036E');

$count = 0;
pg_close($inscon);
$conn_string = "host=".$argv[1]." port=".$argv[2]." dbname=".$argv[3]." user=".$argv[4]." password=".$argv[5];
$inscon = pg_connect($conn_string);

$tableName = "acs".$argv[7]."_".$argv[6]."_".$argv[8]."_tracts";
echo "tableName:$tableName:";
echo "status:Creating Table:";
pg_query(createStatement($tableName,$var_sets)) or die($sql." ".pg_error());
$values = "";

echo "status:Downloading:";
while($row = pg_fetch_array($rs)){
    $properties = array();
    $feature = array();
    $geometry = array();
    $columns = "(geoid,";
    $values .= "(".$row['geoid'].",";
    
    

	for($x = 0; $x < count($var_sets);$x++){
	    $state = substr($row['geoid'],0,2);
	    $county = substr($row['geoid'],2,3);
	    $tract = substr($row['geoid'],5,6);
	    $source= 1;
	    $vars = implode(",",$var_sets[$x]);
	    $jURL = 'http://api.census.gov/data/'.$argv[8].'/'.$sources[$source].'?key=564db01afc848ec153fa77408ed72cad68191211&get='.$vars.'&for=tract:'.$tract.'&in=county:'.$county.'+state:'.$state;
	    $cdata = curl_download($jURL);
	    $foo =  utf8_encode($cdata); 
	    $cdata = json_decode($foo, true);
      
	    for($i =0; $i < count($var_sets[$x]); $i++ ){
	        $columns .= $var_sets[$x][$i].",";
          $values .= intval($cdata[1][$i]).",";
	    }
     
	}
  $columns = rtrim($columns, ",").")";
  $values = rtrim($values, ",")."),";
  	
  $count++;
  echo "progress:". intval($count/$num_rows*100).':';
}
$values = rtrim($values, ",");
echo "status:Inserting Data:";
$sql = "Insert into $tableName $columns VALUES $values";
//echo $sql;
$rs = pg_query($sql) or die($sql." ".pg_error());
echo "status:Complete:";



function curl_download($Url){
 
  if (!function_exists('curl_init')){
      die('Sorry cURL is not installed!');
  }
 
  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $Url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  $output = curl_exec($ch);
  return $output;
}

function createStatement($tableName,$variables){
  
  
  $createStatement = "DROP TABLE IF EXISTS $tableName; CREATE TABLE $tableName ( geoid character varying(11) NOT NULL,";
  for($x = 0; $x < count($variables);$x++){
    for($i =0; $i < count($variables[$x]); $i++ ){
      $createStatement .= $variables[$x][$i]." integer,";
    }
  }
  $createStatement .= " CONSTRAINT ".$tableName."_pkey PRIMARY KEY (geoid)) WITH ( OIDS=FALSE ); ALTER TABLE $tableName OWNER TO postgres;";
  return $createStatement;
}


?>
