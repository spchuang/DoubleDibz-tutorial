
//load common settings first. We also need to guarantee sessionModel is loaded first
define([
	'settings',
	"auth/SessionModel",
], function () {
   require([
      'jquery',
   	'app',
      'vent',
      'reqres',
      'route',  
      "general/centralRequest",
   ], function ($, App, vent, reqres, AppRouter ) {
   	'use strict';
   	
   	
   	/*
   	   Check user athentication during app initialization and trigger "app:start:authentication:done" only after aync call is finished
   	*/
      App.addInitializer(function() {
         //Don't show footer if canvas app
         if(!is_canvas) vent.trigger('showFooter');
         
         vent.trigger("auth:checkAuth", function(){
            vent.trigger("app:start:auth:done");      
         });
         
      });
      
      vent.on("app:start:auth:done", function(options){
         // Start routing once we have captured a user's auth status
         
         App.Router = {};
         
         _.each(AppRouter, function(router, name) {
            App.Router[name] = new router();
            
         });
         
         if(Backbone.history){
            if(!Backbone.history.start({ pushState: true })){
               //no route is matched
               vent.trigger('navigate:404Page');
            }
            console.log("Backbone history is initialized");
         }
      });
 
      //trigger google anlytics on each backbone history change
      var navigate = Backbone.History.prototype.navigate;
      Backbone.History.prototype.navigate = function(fragment, options) {
          navigate.apply(this, arguments);
          if(fragment.charAt(0) != '/'){
             fragment = '/' + fragment;
          }
          
          window._gaq.push(['_trackPageview', fragment]);
      }
      
      
      
      // All navigation that is relative should be passed through the navigate
       // method, to be processed by the router. If the link has a `data-bypass`
       // attribute, bypass the delegation completely.
      $('html').on("click", function(evt) {
         var middleBtnnKey = 2;
         //check if its middle key click
         if( (evt.which == middleBtnnKey) ) return;
         
         //check if its command + click
         if(evt.ctrlKey || evt.metaKey) {
            return;
         }
       
         var navigateTo = $(evt.target).attr('data-navigate');
         if( navigateTo !== undefined){
            vent.trigger("navigate:"+navigateTo);
         }
       
         if(evt.target.tagName !== 'INPUT' && $(evt.target).closest('a').attr('data-bypass') === undefined){
            evt.preventDefault(); 
         }
         
       });
       
      //overwrite  backbone sync, to handle some universal errors
      var oldSync = Backbone.sync;
      Backbone.sync = function(method, model, options){
         //patch will be sent as put
         if(method == 'patch'){
            method = 'update';
         }
         if(method == 'read'){
            options.error = _.wrap(options.error, function(func, res, errorThrown){

               
               //handle not found requests
               if(res.status == 404){
                  return vent.trigger('navigate:404Page');
               }
               
               //handle connection refused (not connected)
               if(res.status == 0){
                  //don't call the error callback funciton
               
               }else{
                  if(_.isFunction(func)) {
                     func(res);
                  }
               }
            });
         }
         
         return oldSync(method, model, options);
      };
      
   	App.start();
   	
   });

});
