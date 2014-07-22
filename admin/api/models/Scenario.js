/**
* Scenario.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
	tracts : 'ARRAY',
	routes : 'ARRAY',
	name : 'STRING',
	parent : 'INTEGER',
	center : 'ARRAY',
	model_type : 'INTEGER',
	trip_table_id : 'INTEGER',
	ampm : 'STRING',
	marketArea : 'INTEGER'
	// marketArea: {
 //      model: 'MarketArea'
 //    },
  }
};

