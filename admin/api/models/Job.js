/**
* Jobs.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	start:{
  		type:'datetime',
  		defaultsTo:new Date()
  	},
  	finish:{
  		type:'datetime'
  	},
  	isFinished:{
      type: 'boolean',
      defaultsTo: false
    },
  	type:'STRING',
  	info:{
  		type:'array'
  	},
    status:'string',
    progress:{
      type:'integer',
      defaultsTo:0
    }
  }
};

