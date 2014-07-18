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
  '/marketarea/new': 'MarketAreaController.new',
  '/marketarea/:id': 'MarketAreaController.show',
  '/marketarea/:id/models': 'MarketAreaController.models',

  //---------------------------------
  // Users Guide Pages
  //---------------------------------
  '/guide/overview': 'GuideController.overview',
  '/guide/getting_started': 'GuideController.getting_started',
  '/guide/quickstart': 'GuideController.quickstart',
  '/guide/gtfs' : 'GuideController.gtfs',
  '/guide/acs' : 'GuideController.acs',
  '/guide/ctpp' : 'GuideController.ctpp',
  '/guide/lodes' : 'GuideController.lodes',
  '/guide/farebox' : 'GuideController.farebox',
  '/guide/custom_data' : 'GuideController.custom_data',
  '/guide/new_market_area' : 'GuideController.new_market_area',
  '/guide/edit_market_area' : 'GuideController.edit_market_area',
  '/guide/mapmodeling' : 'GuideController.mapmodeling',
  '/guide/mapgtfs' : 'GuideController.mapgtfs',
  '/guide/mapcensus' : 'GuideController.mapcensus',
  '/guide/quickstart' : 'GuideController.quickstart',
  '/guide/triptables' : 'GuideController.triptables',
  '/guide/odsources' : 'GuideController.odsources',
  //'/guide/demographics' : 'GuideController.demographics'

  //---------------------------------
  // Data Routes
  //---------------------------------
  '/gtfs/:id/routes' :'MetaGtfsController.getRoutes'

  //----------------------------------
  //File Uploads
  //----------------------------------
  //'/data/gtfs/upload':'UploadsController.gtfsupload'


  // Custom routes here...


  // If a request to a URL doesn't match any of the custom routes above,
  // it is matched against Sails route blueprints.  See `config/blueprints.js`
  // for configuration options and examples.

};
