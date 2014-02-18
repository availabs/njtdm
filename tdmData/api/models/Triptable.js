/**
 * Triptable
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
	trips:'ARRAY',
	model_type:'string',
	model_time:'string',
	model_finished:{
		type:'integer',
		defaultsTo:0
	}
  }

};
