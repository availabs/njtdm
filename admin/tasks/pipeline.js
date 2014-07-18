/**
 * grunt/pipeline.js
 *
 * The order in which your css, javascript, and template files should be
 * compiled and linked from your views and static HTML files.
 *
 * (Note that you can take advantage of Grunt-style wildcard/glob/splat expressions
 * for matching multiple files.)
 */



// CSS files to inject in order
//
// (if you're using LESS with the built-in default config, you'll want
//  to change `assets/styles/importer.less` instead.)
var cssFilesToInject = [
  'styles/application.min.css'
];


// Client-side javascript files to inject in order
// (uses Grunt-style wildcard/glob/splat expressions)
var jsFilesToInject = [

  // Dependencies like sails.io.js, jQuery, or Angular
  // are brought in here
  //'js/dependencies/**/*.js',

  // All of the rest of your client-side js files
  // will be injected here in no particular order.
  // Below, as a demonstration, you'll see the built-in dependencies 
    // linked in the proper order order


    // then beef it up with some convenience logic for talking to Sails.js
    //'js/sails.io.js',

    // *->    put other dependencies here   <-*

    // All of the rest of your app scripts imported here
    "js/jquery-2.0.3.min.js",
    "js/jquery.pjax.js",


    // <!-- jquery plugins -->
    "js/jquery.icheck.js",
    "js/jquery.sparkline.js",
    "js/jquery-ui-1.10.3.custom.js",
    "js/jquery.slimscroll.js",

    // <!-- d3, nvd3-->
    "js/d3.v2.js",
    "js/nv.d3.custom.js",

    // <!-- nvd3 models -->
    "js/scatter.js",
    "js/axis.js",
    "js/legend.js",
    "js/multiBar.js",
    "js/multiBarChart.js",
    "js/line.js",
    "js/lineChart.js",
    "js/stream_layers.js",

    // <!--backbone and friends -->
    "js/underscore-min.js",
    "js/backbone-min.js",
    "js/backbone.localStorage-min.js",

    // <!-- bootstrap default plugins -->
    "js/transition.js",
    "js/collapse.js",
    "js/alert.js",
    "js/tooltip.js",
    "js/popover.js",
    "js/button.js",
    "js/tab.js",
    "js/dropdown.js",

    // <!-- basic application js-->
    "js/app.js",
    "js/settings.js",

    // <!-- page specific -->
    "js/index.js",
];


// Client-side HTML templates are injected using the sources below
// The ordering of these templates shouldn't matter.
// (uses Grunt-style wildcard/glob/splat expressions)
//
// By default, Sails uses JST templates and precompiles them into
// functions for you.  If you want to use jade, handlebars, dust, etc.,
// with the linker, no problem-- you'll just want to make sure the precompiled
// templates get spit out to the same file.  Be sure and check out `tasks/README.md`
// for information on customizing and installing new tasks.
var templateFilesToInject = [
  'templates/**/*.html'
];



// Prefix relative paths to source files so they point to the proper locations
// (i.e. where the other Grunt tasks spit them out, or in some cases, where
// they reside in the first place)
module.exports.cssFilesToInject = cssFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.jsFilesToInject = jsFilesToInject.map(function(path) {
  return '.tmp/public/' + path;
});
module.exports.templateFilesToInject = templateFilesToInject.map(function(path) {
  return 'assets/' + path;
});
