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
  'styles/application.css',
  'styles/dc.css'
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
    'js/sails.io.js',

    // *->    put other dependencies here   <-*

    "lib/angular/angular.min.js",
    "lib/jquery/jquery-2.0.3.min.js",
    "lib/jquery-pjax/jquery.pjax.js",


    //<!-- jquery plugins -->
    //"lib/icheck.js/jquery.icheck.js",
    //"lib/sparkline/jquery.sparkline.js",
    "lib/jquery-ui-1.10.3.custom.js",
    "lib/jquery.slimscroll.js",
    "lib/jquery.ui.widget.js",
    //<!-- d3-->
    "lib/nvd3/lib/d3.v3.min.js",
    
    //<!--backbone and friends -->
    "lib/backbone/underscore-min.js",
    
    //<!-- bootstrap default plugins -->
    "lib/bootstrap/transition.js",
    "lib/bootstrap/collapse.js",
    "lib/bootstrap/alert.js",
    "lib/bootstrap/tooltip.js",
    "lib/bootstrap/popover.js",
    "lib/bootstrap/button.js",
    "lib/bootstrap/tab.js",
    "lib/bootstrap/dropdown.js",
    "lib/bootstrap/modal.js",
    "lib/messenger-1.4.1/messenger.js",
    "lib/messenger-1.4.1/messenger-theme-flat.js",


    // <!-- basic application js-->
    "js/app.js",
    "js/navController.js",
    //"js/settings.js",

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
