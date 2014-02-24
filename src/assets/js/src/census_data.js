censusData = {
  acs : {},
  variables:{},
  census_vars:{
  "total_population":{"name":"Population","vars":['b01003_001e'],"value":0},
  "employment":{"name":"employed","vars":['b12006_005e','b12006_010e','b12006_016e','b12006_021e','b12006_027e','b12006_032e','b12006_038e','b12006_043e','b12006_049e','b12006_054e'],"value":0},
  "unemployment":{"name":"Unemployed","vars":['b12006_006e','b12006_011e','b12006_017e','b12006_022e','b12006_028e','b12006_033e','b12006_039e','b12006_044e','b12006_050e','b12006_055e'],"value":0},
  "travel_to_work_total":{"name":"Total","vars":['b08301_001e'],"value":0},
  "car_to_work":{"name":"Car, truck, or van","vars":['b08301_002e'],"value":0},
  "public_transportation_to_work":{"name":"Public transportation","vars":['b08301_010e'],"value":0},
  "bus_to_work":{"name":"Bus","vars":['b08301_010e'],"value":0},
  "total":{"value":0,"vars":['b08126_001e'], "name":"Total:"},
  "agriculture":{"value":0,"vars":['b08126_002e'], "name":"Agriculture, forestry, fishing and hunting, and mining"},
  "construction":{"value":0,"vars":['b08126_003e'], "name":"Construction"},
  "manufacturing":{"value":0,"vars":['b08126_004e'], "name":"Manufacturing"},
  "wholesale":{"value":0,"vars":['b08126_005e'], "name":"Wholesale trade"},
  "retail":{"value":0,"vars":['b08126_006e'], "name":"Retail trade"},
  "transportation":{"value":0,"vars":['b08126_007e'], "name":"Transportation and warehousing, and utilities"},
  "information":{"value":0,"vars":['b08126_008e'], "name":"Information"},
  "finance":{"value":0,"vars":['b08126_009e'], "name":"Finance and insurance, and real estate and rental and leasing"},
  "professional":{"value":0,"vars":['b08126_010e'], "name":"Professional, scientific, and management, and administrative and waste management services"},
  "educational":{"value":0,"vars":['b08126_011e'], "name":"Educational services, and health care and social assistance"},
  "arts":{"value":0,"vars":['b08126_012e'], "name":"Arts, entertainment, and recreation, and accommodation and food services"},
  "other":{"value":0,"vars":['b08126_013e'], "name":"Other services (except public administration)"},
  "public_administration":{"value":0,"vars":['b08126_014e'], "name":"Public administration"},
  "armed_forces":{"value":0,"vars":['b08126_015e'], "name":"Armed forces "}
},
categories : {
  "Population":["total_population"],
  "Employment":["employment","unemployment"],
  "Journey To Work":["travel_to_work_total","bus_to_work","public_transportation_to_work","bus_to_work"],
  "Industry":["total","agriculture","construction","manufacturing","wholesale","retail","transportation","information","finance","professional","educational","arts","other","public_administration","armed_forces"]
},
  update_data:function(tracts){
     
    for (var census_var in censusData.census_vars){
      censusData.census_vars[census_var].value = 0;
    }
    tracts.forEach(function(tract){
      censusData.acs[tract.geoid] = {};
      for (var census_var in censusData.census_vars){
        var value = 0;

        for(var x = 0; x < censusData.census_vars[census_var].vars.length; x++ ){
           //console.log(tract[censusData.census_vars[census_var].vars[x]],censusData.census_vars[census_var].vars[x],x);
           value+=tract[censusData.census_vars[census_var].vars[x]]*1;
        }

        censusData.acs[tract.geoid][census_var] = value;
        censusData.census_vars[census_var].value += censusData.acs[tract.geoid][census_var];
      }
    });
  }
};