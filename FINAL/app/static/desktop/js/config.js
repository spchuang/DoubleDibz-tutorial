"use strict";

requirejs.config({
    baseUrl: '/static/desktop/js/',
    paths: {
        "jquery"                 : 'vendors/jquery/jquery',
        "text"                   : 'vendors/requirejs-text/text',
        "handlebars"             : 'vendors/handlebars/handlebars',
        'bootstrap'              : 'vendors/bootstrap/bootstrap',
        //'bootstrap'              : 'vendor/bootstrap-3.3.0/bootstrap',
        "backbone"               : 'vendors/backbone/backbone',
        "underscore"             : 'vendors/underscore/underscore',
        "marionette"             : 'vendors/backbone.marionette/backbone.marionette',
        "timeago"                : 'vendors/jquery-timeago/jquery.timeago',
        'jquery.fileupload'      : 'vendors/blueimp-file-upload/jquery.fileupload',
        'jquery.iframe-transport': 'vendors/blueimp-file-upload/jquery.iframe-transport',
        'jquery.ui.widget'       : 'vendors/blueimp-file-upload/jquery.ui.widget',
        /*'canvas-to-blob'         : 'vendors/blueimp-canvas-to-blob/canvas-to-blob',
        'load-image'             : 'vendors/blueimp-load-image/load-image',
        'load-image-meta'        : 'vendors/blueimp-load-image/load-image-meta',
        'load-image-exif'        : 'vendors/blueimp-load-image/load-image-exif',
        'load-image-ios'         : 'vendors/blueimp-load-image/load-image-ios',*/
        'Jcrop'                  : 'vendors/Jcrop/jquery.Jcrop',
        
        'backbone.poller'        : 'vendors/backbone-poller/backbone.poller',
        
        'bootstrap-tour'         : 'vendors/bootstrap-tour/bootstrap-tour',
        'typeahead'              : 'vendors/typeahead.js/typeahead.jquery',
        'bloodhound'             : 'vendors/typeahead.js/bloodhound',
        'jquery.slimscroll'      : 'vendors/slimscroll/jquery.slimscroll',
        'jquery.textcomplete'    : 'vendors/jquery-textcomplete/jquery.textcomplete.min',
        'typed'                  : 'vendors/typed.js/typed',
        "jQuery-linkify"         : 'vendors/jQuery-linkify/jquery.linkify.min',
        //'jquery.overlay'         : '../vendors/jquery.plugins/jquery.overlay',
        
        //waiting for bower update
        //"backbone-forms"         : 'vendors/backbone-forms/backbone-forms',
        //'bbf-bootstrap3'         : "vendors/backbone-forms/bootstrap3",
        //'jquery.unveil'          : 'vendors/jquery-unveil/jquery.unveil',
        
        //libraries not from bower
        'bootstrap-tagsinput'    : 'vendor/bootstrap-tagsinput',
        'jquery.unveil'          : 'vendor/jquery.unveil',
        "backbone-forms"         : 'vendor/backbone-forms-0.14/backbone-forms',
        'bbf-bootstrap3'         : "vendor/backbone-forms-0.14/bootstrap3",
        "bootstrap-modal"        : 'vendor/backbone.bootstrap-modal',
        'facebook'               : 'vendor/FB',
        
   },
    shim: {
      'underscore': {
         exports: '_'
      },
      'backbone': {
         deps: ["underscore", "jquery"],
         exports: "Backbone",
         init: function() { 
            Backbone.$ = window.$;
         }
      },
      'handlebars': {
         exports: 'Handlebars'
      },
      'marionette' : {
         deps : ['jquery', 'underscore', 'backbone'],
         exports : 'Marionette'
      },
      "bootstrap": {
         deps: ["jquery"]
      },
      'bootstrap-modal':{
         deps: ['jquery','underscore','backbone']
      },
      'bootstrap-tour':{
         deps: ['bootstrap', 'jquery'] 
      },
      'jquery.iframe-transport':{
         deps: ['jquery']
      },
      'backbone-poller':{
         deps: ['underscore', 'backbone']
      },
      'facebook' : {
         exports: 'FB'
      },
      'bootstrap-tagsinput': {
         deps: ['jquery']
      },
      'typeahead':{
         desps:['jquery']
      },
      'bloodhound':{
         deps: ["jquery"],
         exports: "Bloodhound"
      },
      'jquery.textcomplete': {
         deps: ['jquery']
      },
      'jquery.unveil':{
         deps: ['jquery']
      },
      'typed':{
         deps: ['jquery']
      },
    }
    ,
    urlArgs: "bust=" + (new Date()).getTime(), //remove cache
    
});



