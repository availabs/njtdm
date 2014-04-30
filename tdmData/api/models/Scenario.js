/**
 * Scenario
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
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
	ampm : 'INTEGER',
	marketArea : 'INTEGER'
  }

};
