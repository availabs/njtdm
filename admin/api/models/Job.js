/**
* Jobs.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/
var kill = require('tree-kill');


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

    pid:'string',

    status:'string',
    
    progress:{
      type:'integer',
      defaultsTo:0
    }
  },

  beforeUpdate: function(values, next){
    console.log('before Job Update',values)
    //-------------------------------------------
    //If job is killed by user, kill the Process
    //-------------------------------------------
    if(values.status){
      if(values.status == 'Cancelled' && values.pid){
        console.log('Job Update Cancelling');
        kill(values.pid, 'SIGKILL');
      }
    }
  }

};

