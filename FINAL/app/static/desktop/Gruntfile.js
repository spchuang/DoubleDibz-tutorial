// Gruntfile.js

// our wrapper function (required by grunt and its plugins)
// all configuration goes inside this function
module.exports = function(grunt) {
   'use strict';
   
   var BUILD_JS_DIR  = 'dist/js'
   
   // ===========================================================================
   // CONFIGURE GRUNT ===========================================================
   // ===========================================================================
   grunt.initConfig({
      
      // get the configuration info from package.json ----------------------------
      // this way we can use things like name and version (pkg.name)
      pkg: grunt.file.readJSON('package.json'),
      
      // all of our configuration will go here
      less: {
         build: {
            files: {
               'css/main.css': 'css/main.less'
            }
         },
      },
      // configure cssmin to minify css files ------------------------------------
      cssmin: {
         options: {
            banner: '/*\n <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> \n*/\n'
         },
         build: {
            files: {
               'dist/css/main.min.css': 'css/main.css'
            }
         }
      },
      clean: {
         js: ["dist/js/*", "!dist/js/vendors", "!dist/js/main.js", "!dist/js/infrastructure.js"]
      },
      requirejs: {
         compile: {
            options: {
               mainConfigFile : "js/config.js",
               baseUrl : "./",
               appDir: "js/",
               dir: BUILD_JS_DIR,
               removeCombined: true,
               findNestedDependencies: true,
               //optimize: "none", 
               wrapShim: true,
               almond:true,
               preserveLicenseComments: false,
               modules: [
                 {
                     name: "main",
                     exclude: [ "infrastructure" ]
                 },
                 {name: "infrastructure"}
               ]
               
            }
         }
      }
   });
   
   // ===========================================================================
   // LOAD GRUNT PLUGINS ========================================================
   // ===========================================================================
   // we can only load these if they are in our package.json
   // make sure you have run npm install so our app can find these
   grunt.loadNpmTasks('grunt-contrib-less');
   grunt.loadNpmTasks('grunt-contrib-cssmin');
   grunt.loadNpmTasks('grunt-contrib-watch');
   grunt.loadNpmTasks('grunt-contrib-clean');
   grunt.loadNpmTasks('grunt-contrib-requirejs');

   // ===========================================================================
   // CREATE TASKS ==============================================================
   // ===========================================================================
   grunt.registerTask('css', ['less', 'cssmin']);
   
   
   grunt.registerTask('compile', ['css', 'requirejs', 'clean'])

};
