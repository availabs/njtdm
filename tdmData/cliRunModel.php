<?php
 $dbh = pg_connect("host=localhost dbname=tdmData user=postgres");

 $sql = "SELECT trips FROM triptable where id = ".$argv[1];
 $result = pg_query($dbh, $sql);
 $row = pg_fetch_array($result);
 $trips = json_decode($row['trips']);
 print_r($trips);