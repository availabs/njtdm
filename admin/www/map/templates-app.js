angular.module('templates-app', ['home/home.tpl.html', 'home/partials/gtfs_tab.tpl.html', 'home/partials/model_analysis.tpl.html', 'home/partials/new_model.tpl.html', 'home/partials/triptable.tpl.html', 'report/report.tpl.html']);

angular.module("home/home.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("home/home.tpl.html",
    "<leaflet height=\"100%\" width=\"100%\" center=\"center\" layers=\"layers\" event-broadcast=\"events\"></leaflet>\n" +
    "<div id=\"legend\">\n" +
    "        <h2><a href=\"javascript:void()\" class=\"closed\">Legend</a></h2>\n" +
    "        <div id=\"legend-detail\">\n" +
    "            <ul>\n" +
    "                <div id=\"route-legend-div\">\n" +
    "                  <li><svg width=\"20\" height=\"20\"><path d=\"M0 10 L20 10 Z\" class=\"route-legend\"></path></svg><span>route<span></span></span></li>\n" +
    "                </div>\n" +
    "                <div id=\"stop-legend-div\">\n" +
    "                  <li><svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"7\" fill=\"#c00\" class='stop-legend'></circle></svg><span>stop</span></li>\n" +
    "                </div>\n" +
    "                <div id=\"origin-dest-div\">\n" +
    "                  <li><svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"7\" fill=\"#c00\" class='origin-legend'></circle></svg><span class=\"hider\">origin</span></li>\n" +
    "                  <li><svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"7\" fill=\"#c00\" class='dest-legend'></circle></svg><span class=\"hider\">dest</span></li>\n" +
    "                </div>\n" +
    "            </ul>\n" +
    "            <hr>\n" +
    "            <div id=\"choro_legend\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "<div class=\"model_overlay\">\n" +
    " <div ng-include=\"'home/partials/model_analysis.tpl.html'\"></div>\n" +
    "</div>\n" +
    "<div class=\"info_overlay\">\n" +
    "  <tabset>\n" +
    "    <tab heading=\"Modeling\">\n" +
    "       <div ng-include=\"'home/partials/triptable.tpl.html'\"></div>\n" +
    "    </tab> \n" +
    "    <tab heading=\"Census\">\n" +
    "      <div class=\"info_container\">\n" +
    "        <label class=\"info_label\">Census Data</label>\n" +
    "        <accordion close-others=\"true\">\n" +
    "          <accordion-group heading=\"Total Population\" is-open=\"true\">\n" +
    "            <table class=\"table table-striped table-hover\">\n" +
    "              <tr>\n" +
    "                <td> Total Population </td>\n" +
    "                <td ng-click=\"choropleth('total_population')\"> {{ census_vars.total_population.value | number }} <i class=\"fa fa-bar-chart-o\"></i> </td>\n" +
    "                <td> </td>\n" +
    "              </tr>\n" +
    "            </table>\n" +
    "          </accordion-group>\n" +
    "          <accordion-group heading=\"{{name}}\" ng-repeat=\"(name,vars) in census_categories\" style=\"background-color:#fff\">\n" +
    "\n" +
    "            <table class=\"table table-hover\">\n" +
    "              <tr ng-repeat=\"var in vars\">\n" +
    "                <td> {{  census_vars[var].name }}</td>\n" +
    "                <td ng-click=\"choropleth(var)\" > {{ census_vars[var].value | number }} <i class=\"fa fa-bar-chart-o\"></i> </td>\n" +
    "              </tr>\n" +
    "            </table>\n" +
    "          </accordion-group>\n" +
    "        </accordian>\n" +
    "      </div>\n" +
    "    </tab>\n" +
    "    <tab heading=\"GTFS\">\n" +
    "       <div ng-include=\"'home/partials/gtfs_tab.tpl.html'\"></div>\n" +
    "    </tab>\n" +
    "  </tabset>\n" +
    "</div>\n" +
    "");
}]);

angular.module("home/partials/gtfs_tab.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("home/partials/gtfs_tab.tpl.html",
    "<tabset>\n" +
    "  <tab heading=\"Routes\">\n" +
    "     <div class=\"info_container\">\n" +
    "      <button class=\"btn btn-info\" ng-click=\"routes_visible()\">Show/Hide Routes</button>\n" +
    "      <br />\n" +
    "      <div class=\"container\" width=\"350px\">\n" +
    "        <div class=\"row\">\n" +
    "          <div class=\"col-xs-1\">\n" +
    "            <table class=\"table table-hover\">\n" +
    "              <thead>\n" +
    "                <tr>\n" +
    "                  <th><input type=\"text\" ng-model='routeFilter' ng-change='updateRoutes(routeFilter)' placeholder='filter'></th>\n" +
    "                </tr>\n" +
    "                <tr>\n" +
    "                  <th>Route</th>\n" +
    "                </tr>\n" +
    "              </thead>\n" +
    "              <tbody>\n" +
    "              <tr ng-repeat=\"route in route_properties | filterRoutes: routeFilter\">\n" +
    "                <td ng-click=\"route_trips(route.properties.route_short_name)\">{{ route.properties.route_short_name }}</td>\n" +
    "              </tr>\n" +
    "              </tbody>\n" +
    "              <tfoot>\n" +
    "                <tr>\n" +
    "                </tr>\n" +
    "              </tfoot>\n" +
    "            </table>\n" +
    "          </div>\n" +
    "          <div class=\"col-xs-4\">\n" +
    "            <table class=\"table table-hover\">\n" +
    "              <thead>\n" +
    "                <tr>\n" +
    "                  <th class=\"col-xs-3\">Headsign</th><th class=\"col-xs-1\">Departure Time</th>\n" +
    "                </tr>\n" +
    "              </thead>\n" +
    "              <tbody>\n" +
    "              <tr ng-repeat=\"trip_datum in route_trip_data\">\n" +
    "                <td>{{ trip_datum.trip_headsign }}</td><td>{{ trip_datum.departure_time }}</td>\n" +
    "              </tr>\n" +
    "              </tbody>\n" +
    "              <tfoot>\n" +
    "                <tr>\n" +
    "                </tr>\n" +
    "              </tfoot>\n" +
    "            </table>\n" +
    "          </div>\n" +
    "        </div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    "  </tab>\n" +
    "  <tab heading=\"Stops\">\n" +
    "     <div class=\"info_container\">\n" +
    "      <button class=\"btn btn-info\" ng-click=\"stops_visible()\">Show/Hide Stops</button>\n" +
    "        <table class=\"table table-hover\">\n" +
    "          <thead>\n" +
    "            <tr>\n" +
    "              <th><input type=\"text\" ng-model='stopFilter' ng-change='updateStops(stopFilter)' placeholder='filter'></th>\n" +
    "            </tr>\n" +
    "            <tr>\n" +
    "              <th>Stop Name</th><th>Stop Code</th>\n" +
    "            </tr>\n" +
    "          </thead>\n" +
    "          <tbody>\n" +
    "          <tr ng-repeat=\"stop in stop_properties | filterStops: stopFilter\">\n" +
    "            <td>{{ stop.properties.stop_name }}</td><td>{{ stop.properties.stop_code }}</td>\n" +
    "          </tr>\n" +
    "          </tbody>\n" +
    "          <tfoot>\n" +
    "            <tr>\n" +
    "            </tr>\n" +
    "          </tfoot>\n" +
    "        </table>\n" +
    "    </div>\n" +
    "  </tab>\n" +
    "</tabset>");
}]);

angular.module("home/partials/model_analysis.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("home/partials/model_analysis.tpl.html",
    "<div class=\"info_container\">\n" +
    " Model Data\n" +
    "  <select ui-select2   ng-model=\"current_model_index\" class='template_select'>\n" +
    "    <option  ng-repeat=\"model in finished_models\" value=\"{{ model.id}}\">{{ model.name }}</option>\n" +
    "  </select>\n" +
    "    <br><br>\n" +
    "    <a class=\"btn btn-info\" ng-click=\"loadModelData(current_model_index)\" ng-disabled=\"active_run\">Load Model Data</a>\n" +
    "    <a class=\"btn btn-info\" href=\"#/report\">Model Data Viewer</a>\n" +
    "  <br><br>\n" +
    "  <tabset>\n" +
    "    <tab heading=\"info\">\n" +
    "      <table class=\"table table-hover\">\n" +
    "        <thead>\n" +
    "          <tr>\n" +
    "            <td># Transfers</td>\n" +
    "            <td># Passengers</td>\n" +
    "          </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr ng-repeat=\"transfer in transfer_counts\">\n" +
    "          <td>{{ transfer.key }}</td><td>{{  transfer.value }}</td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "        <tfoot>\n" +
    "          <tr>\n" +
    "          </tr>\n" +
    "        </tfoot>\n" +
    "      </table>\n" +
    "      <div id=\"graphDiv\"></div>\n" +
    "\n" +
    "      <table class=\"table table-hover\">\n" +
    "        <thead>\n" +
    "          <tr>\n" +
    "            <td>Wait Type</td>\n" +
    "            <td>Number</td>\n" +
    "            <td>Percent</td>\n" +
    "          </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr>\n" +
    "          <td>No Waits:</td><td>{{  wait_time_data.no_waits }}</td><td>{{  wait_time_data.percent_no_waits  }}%</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "          <td>Norm Waits:</td><td>{{  wait_time_data.normal_waits }}</td><td>{{  wait_time_data.percent_norm_waits  }}%</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "          <td>Bad Waits:</td><td>{{  wait_time_data.bad_waits }}</td><td>{{  wait_time_data.percent_bad_waits  }}%</td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "        <tfoot>\n" +
    "          <tr>\n" +
    "            <td>Total:</td><td>{{  wait_time_data.total_waits  }}</td>\n" +
    "          </tr>\n" +
    "        </tfoot>\n" +
    "      </table>\n" +
    "\n" +
    "    </tab>\n" +
    "    <tab heading=\"Routes\" active=\"modelTabs.active\">\n" +
    "      <br>\n" +
    "      <a class=\"btn btn-info\" ng-click=\"vizRoutes()\" >Show Routes by Riders</a>\n" +
    "      <br>\n" +
    "      <table class=\"table table-hover\">\n" +
    "        <thead>\n" +
    "          <tr>\n" +
    "          <td>Route</td>\n" +
    "          <td># Passengers</td>\n" +
    "        </tr>\n" +
    "        </thead>\n" +
    "        <tbody>\n" +
    "        <tr ng-repeat=\"route in route_count\">\n" +
    "          <td>{{ route.key }}</td><td>{{  route.value }}</td>\n" +
    "        </tr>\n" +
    "        </tbody>\n" +
    "        <tfoot>\n" +
    "          <tr>\n" +
    "            <td>Total:</td>\n" +
    "            <td>{{ route_total }}</td>\n" +
    "          </tr></tfoot>\n" +
    "      </table>\n" +
    "    </tab>\n" +
    "\n" +
    "    <tab heading=\"Tracts\">\n" +
    "    </tab>\n" +
    "    <tab heading=\"Stops\">\n" +
    "      <tabset>\n" +
    "        <tab heading=\"Boardings\">\n" +
    "          <br>\n" +
    "          <a class=\"btn btn-info\" ng-click=\"vizBoardings()\">Show Boardings</a>\n" +
    "          <br>\n" +
    "          <table class=\"table table-hover\">\n" +
    "            <thead>\n" +
    "              <tr>\n" +
    "              <td>Stop</td>\n" +
    "              <td># Passengers</td>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr ng-repeat=\"stop in on_stops\">\n" +
    "              <td>{{ stop.key }}</td><td>{{  stop.value }}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "            <tfoot>\n" +
    "              <tr>\n" +
    "                <td>Total:</td>\n" +
    "                <td>{{ on_stops_total }}</td>\n" +
    "              </tr></tfoot>\n" +
    "          </table>\n" +
    "        </tab>\n" +
    "        <tab heading=\"Alightings\">\n" +
    "          <table class=\"table table-hover\">\n" +
    "            <br>\n" +
    "            <a class=\"btn btn-info\" ng-click=\"vizAlightings()\" >Show Alightings</a>\n" +
    "            <br>\n" +
    "            <thead>\n" +
    "              <tr>\n" +
    "              <td>Stop</td>\n" +
    "              <td># Passengers</td>\n" +
    "            </tr>\n" +
    "            </thead>\n" +
    "            <tbody>\n" +
    "            <tr ng-repeat=\"stop in off_stops\">\n" +
    "              <td>{{ stop.key }}</td><td>{{  stop.value }}</td>\n" +
    "            </tr>\n" +
    "            </tbody>\n" +
    "            <tfoot>\n" +
    "              <tr>\n" +
    "                <td>Total:</td>\n" +
    "                <td>{{ off_stops_total }}</td>\n" +
    "              </tr></tfoot>\n" +
    "          </table>\n" +
    "        </tab>\n" +
    "      </tabset>\n" +
    "    </tab>\n" +
    "  </tabset>\n" +
    "</div>");
}]);

angular.module("home/partials/new_model.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("home/partials/new_model.tpl.html",
    "<div class=\"modal-header\">\n" +
    "    <h3>Run New Model</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "    Enter Model Name: \n" +
    "    <input type=\"text\" ng-model=\"model_name\">\n" +
    "</div>\n" +
    "<div class=\"modal-footer\">\n" +
    "    <button class=\"btn btn-primary\" ng-click=\"ok(model_name)\">OK</button>\n" +
    "    <button class=\"btn btn-warning\" ng-click=\"cancel()\">Cancel</button>\n" +
    "</div>");
}]);

angular.module("home/partials/triptable.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("home/partials/triptable.tpl.html",
    "<tabset>\n" +
    "  <tab heading=\"Settings\">\n" +
    "  <div class=\"info_container\">\n" +
    "    <label class=\"info_label\">Market Area Template</label>\n" +
    "      <select ui-select2   ng-model=\"current_template_index\" class='template_select' ng-change=\"scenario_select(current_template_index)\">\n" +
    "        <option  ng-repeat=\"scenario in allScenarios\" value=\"{{ $index }}\" ng-selected=\"{{ $index == current_template_index }}\">{{ scenario.name }}</option>\n" +
    "      </select>\n" +
    "      <label class=\"info_label\">Overview</label>\n" +
    "      <table class=\"table table-hover\">\n" +
    "        <tr>\n" +
    "          <td>Trips Planned</td><td>{{ trip_table.length | number }}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "          <td>Trips Unroutable</td><td>{{ tt_failed}}</td>\n" +
    "        </tr>\n" +
    "        <tr>\n" +
    "          <td>Number of Tracts </td><td>{{ tracts.length | number }}</td>\n" +
    "        </tr>\n" +
    "      </table>\n" +
    "      <div class=\"btn-group\">\n" +
    "        <button class=\"btn btn-info\" ng-click=\"tt_choropleth('outbound_trips')\">Map Outbound Trips</button>\n" +
    "        <button class=\"btn btn-info\" ng-click=\"tt_choropleth('inbound_trips')\">Map Inbound Trips</button>\n" +
    "      </div>\n" +
    "      <label>Trip Table Generator</label>\n" +
    "      <select ui-select2   ng-model=\"model_type\" class='template_select'>\n" +
    "       <option value=\"lehdbus\" >LEHD + ACS % Bus Trips</option>\n" +
    "       <option value=\"ctpp\" >CTPP 2010 Bus Trips</option>\n" +
    "       <option value=\"censusregression\" >Regression Model Trips</option>\n" +
    "       <option value=\"survey\">Survey Weighted Trips</option>\n" +
    "      </select>\n" +
    "      <div ng-show=\"showOD(model_type)\">\n" +
    "        <label>OD Source</label>\n" +
    "        <select ui-select2   ng-model=\"model_od\" class='template_select' ng-change=\"update_od(model_od)\">\n" +
    "         <option value=\"stops\">Bus Stops</option>\n" +
    "         <option value=\"survey\">Parcels</option>\n" +
    "         <option value=\"survey\">Survey</option>\n" +
    "        </select>\n" +
    "        {{model_od}}\n" +
    "      </div>\n" +
    "       <label>Model Time</label>\n" +
    "      <select ui-select2   ng-model=\"model_time\" class='template_select' ng-change=\"update_time(model_time)\">\n" +
    "       <option value=\"am\" selected>AM Peak</option>\n" +
    "       <option value=\"pm\">PM Peak</option>\n" +
    "       <option value=\"fullday\">Full Day</option>\n" +
    "       {{model_time}}\n" +
    "      </select>\n" +
    "      <br><br>\n" +
    "      <a class=\"btn btn-info\" ng-click=\"saveScenario()\">Save Current Scenario</a>\n" +
    "      <br><br>\n" +
    "      <a class=\"btn btn-info\" ng-click=\"newTripTable(model_type)\">Update Trip Table</a>\n" +
    "      <a class=\"btn btn-info\" ng-click=\"newModel()\" ng-disabled=\"active_run\">Run Model</a>\n" +
    "      <br><br>\n" +
    "      \n" +
    "\n" +
    "      <div ng-show=\"active_run\">\n" +
    "       {{run_progress}} / {{run_max}}\n" +
    "       <progressbar value=\"run_progress\" max=\"run_max\"><span style=\"color:black; white-space:nowrap;\"></span></progressbar>\n" +
    "      </div>\n" +
    "  </div>\n" +
    "  </tab>\n" +
    "  <tab heading=\"Trip Table\">\n" +
    "    <a class=\"btn btn-info\" ng-click=\"mapTripTable()\">Show/Hide Trips on Map</a>\n" +
    "     <div class=\"info_container\">\n" +
    "      <label class=\"info_label\">Trips</label>\n" +
    "        <table class=\"table table-striped table-hover trip-display\">\n" +
    "            <tr>\n" +
    "              <td>Id</td>\n" +
    "              <td >Time</td>\n" +
    "              <td colspan=2>From</td>\n" +
    "              <td colspan=2>To</td>\n" +
    "            </tr>\n" +
    "          <input type=\"text\" ng-model=\"tt_search.from_geoid\" placeholder=\"Search Origin FIPS\" class=\"tt_search\">\n" +
    "          <input type=\"text\" ng-model=\"tt_search.to_geoid\"  placeholder=\"Search Destination FIPS\" class=\"tt_search\">\n" +
    "            <tr ng-repeat=\"trip in trip_table | filter: tt_search | startFrom:tt_currentPage*tt_pageSize | limitTo:tt_pageSize\">\n" +
    "              <td>{{trip.id}}</td>\n" +
    "              <td>{{trip.time}}</td>\n" +
    "              <td>{{trip.from_coords}}</td><td>{{trip.from_geoid.substr(5,6)}}</td>\n" +
    "              <td>{{trip.to_coords}}</td><td>{{trip.from_geoid.substr(5,6)}}</td>\n" +
    "            </tr>\n" +
    "        </table>\n" +
    "        <button ng-disabled=\"tt_currentPage == 0\" ng-click=\"tt_currentPage=currentPage-1\"><-</button>\n" +
    "          {{ tt_currentPage*tt_pageSize}} - {{ (tt_currentPage*tt_pageSize)+tt_pageSize }} of {{ tt_total }} <button class=\"btn-info rounded\" ng-disabled=\"tt_currentPage >= tt_total/tt_pageSize - 1\" ng-click=\"tt_currentPage=tt_currentPage+1\"> -> </button>\n" +
    "    </div>\n" +
    "  </tab>\n" +
    "  <tab heading=\"Landmarks\">\n" +
    "      <div class=\"info_container\">\n" +
    "      Landmarks Interface\n" +
    "      </div>\n" +
    "  </tab>\n" +
    "</tabset>");
}]);

angular.module("report/report.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("report/report.tpl.html",
    "<div class=\"container\" style=\"margin-top:60px\">\n" +
    "\n" +
    "    <div class=\"row\">\n" +
    "\n" +
    "        <div class=\"col-md-3\">\n" +
    "            <p class=\"lead\" style='line-height:15px'>Market Areas <br><small style=\"font-size:12px;\"><a href=\"/map/\">Back to Map</a></small></p>\n" +
    "            <div class=\"list-group\">\n" +
    "                <a ng-repeat=\"market in marketAreas\" class=\"list-group-item\" ng-class=\"isActiveMarket(market.id)\" ng-click=\"setActiveMarket(market.id)\">{{market.name}}</a>\n" +
    "            </div>\n" +
    "            <div class=\"list-group\">\n" +
    "                <a ng-repeat=\"time in times\" class=\"list-group-item\" ng-class=\"isActiveTime(time)\" ng-click=\"setActiveTime(time)\">{{time}}</a>\n" +
    "            </div>\n" +
    "            <select ui-select2   ng-model=\"current_model_index\" class='template_select'>\n" +
    "              <option  ng-repeat=\"model in finished_models | filter:{marketArea:activeMarket}\" value=\"{{model.id}}\">{{ model.name }}</option>\n" +
    "            </select>\n" +
    "            <br><br>\n" +
    "            <p class='btn-grp'>\n" +
    "                <a class='btn btn-info' ng-click=\"loadModelData(current_model_index)\" ng-disabled='loading'> Load Model </a>\n" +
    "            </p>\n" +
    "            <div class=\"progress progress-striped active\" ng-show='loading'>\n" +
    "              <div class=\"progress-bar\"  role=\"progressbar\" aria-valuenow=\"100\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 100%\">\n" +
    "                <span class=\"sr-only\">Loading Data</span>\n" +
    "              </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <div class=\"col-md-9\">\n" +
    "            <ol class=\"breadcrumb\">\n" +
    "              <li><a href=\"#\">{{marketAreas[activeMarket].name}}</a></li>\n" +
    "            </ol>\n" +
    "            <div class=\"well\" ng-show='loadedModels.length > 0'>\n" +
    "                <span class=\"label\" ng-repeat=\"model in loadedModels\" style=\"{{'margin:3px;background-color:'+colors[$index]}}\">{{model.name}}</span>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"thumbnail\" style=\"overflow:hidden;\">\n" +
    "                <div id=\"graphDiv\">\n" +
    "                    <div id=\"route-count\"></div>\n" +
    "                    <div id=\"route-count-table\"></div>\n" +
    "                    <div id=\"start-time\"></div>\n" +
    "                    <div id=\"trip-duration\"></div>\n" +
    "                    <div id=\"trip-wait-time\"></div>\n" +
    "                    <div id=\"trip-distance\"></div>\n" +
    "                    <div id=\"boarding-choropleth\"></div>\n" +
    "                    <div id=\"alighting-choropleth\"></div>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <div class=\"well\">\n" +
    "\n" +
    "\n" +
    "        </div>\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);
