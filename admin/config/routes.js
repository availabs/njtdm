/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * For more information on routes, check out:
 * http://links.sailsjs.org/docs/config/routes
 */

module.exports.routes = {

  //---------------------------------
  // Home Pages
  //---------------------------------
  '/': 'HomeController.dashboard',
  '/data/gtfs': 'HomeController.gtfs',
  '/data/acs': 'HomeController.acs',
  '/data/ctpp': 'HomeController.ctpp',
  '/data/lodes': 'HomeController.lodes',
  '/marketarea/new': 'HomeController.marketareaNew',


  //---------------------------------
  // Market Area Pages
  //---------------------------------
  '/marketarea/new': 'MarketAreaController.manew',
  '/marketarea/:id': 'MarketAreaController.overview',
  '/marketarea/:id/models': 'MarketAreaController.models',

  //----------------------------------
  //File Uploads
  //----------------------------------
  //'/data/gtfs/upload':'UploadsController.gtfsupload'


  // Custom routes here...


  // If a request to a URL doesn't match any of the custom routes above,
  // it is matched against Sails route blueprints.  See `config/blueprints.js`
  // for configuration options and examples.

};
