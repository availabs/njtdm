/**
 * Routes
 *
 * Sails uses a number of different strategies to route requests.
 * Here they are top-to-bottom, in order of precedence.
 *
 * For more information on routes, check out:
 * http://sailsjs.org/#documentation
 */



/**
 * (1) Core middleware
 *
 * Middleware included with `app.use` is run first, before the router
 */


/**
 * (2) Static routes
 *
 * This object routes static URLs to handler functions--
 * In most cases, these functions are actions inside of your controllers.
 * For convenience, you can also connect routes directly to views or external URLs.
 *
 */
var accessible =  {
      origin: '*',
      methods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      headers: 'content-type,X-Requested-With'
    };

module.exports.routes = {

  // By default, your root route (aka home page) points to a view
  // located at `views/home/index.ejs`
  // 
  // (This would also work if you had a file at: `/views/home.ejs`)
  '/': {
    view: 'home/index'
  },
  
  //Tracts Controller
  '/tracts/state/:stateFIPS':{
    controller : 'TractsController',
    action : 'stateTracts',
    cors: accessible
  },
  '/tracts/scenario/:scenarioid':{
    controller : 'TractsController',
    action : 'scenarioTracts',
    cors: accessible
  },
  '/tracts/acs':{
    controller : 'TractsController',
    action : 'acs',
    cors: accessible
  },
  '/tracts/lehdTrips':{
    controller : 'TractsController',
    action : 'lehdTrips',
    cors: accessible
  },
  '/tracts/surveyTrips':{
    controller : 'TractsController',
    action : 'surveyTrips',
    cors: accessible
  },
  '/tracts/ctppTrips':{
    controller : 'TractsController',
    action : 'ctppTrips',
    cors: accessible
  },

  //GTFS Controller
  '/gtfs/routes':{
    controller : 'GtfsController',
    action : 'routes',
    cors: accessible
  },
   '/gtfs/stops':{
    controller : 'GtfsController',
    action : 'stops',
    cors: accessible
  },
  '/gtfs/routetrips':{
    controller: 'GtfsController',
    action: 'route_trips',
    cors: accessible
  },
  

  //Trip Table Controller
  '/triptable/:id/run':{
    controller : 'TriptableController',
    action : 'runModel',
    cors: accessible
  },
  '/triptable/:id/status':{
    controller : 'TriptableController',
    action : 'runStatus',
    cors: accessible
  },
  '/triptable/:id/modeldata':{
    controller : 'TriptableController',
    action : 'modelData',
    cors: accessible
  },
  '/triptable/finished':{
    controller : 'TriptableController',
    action : 'models',
    cors: accessible
  },
  '/triptable/farebox':{
    controller : 'TriptableController',
    action : 'fareboxData',
    cors: accessible
  },
  '/triptable/marketdata':{
    controller : 'TriptableController',
    action : 'marketdata',
    cors: accessible
  }
};
