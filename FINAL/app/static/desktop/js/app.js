define([
  'jquery',
  'marionette',
  'vent',
  'templates/LoadingSignView'
],
function ($, Marionette, vent, LoadingSignView) {
   "use strict";
   var App = new Marionette.Application();
   
   App.addRegions({
      headerRegion: "#header-region",
      alertRegion: "#alert-region",
      mainRegion: "#main-region",
      footerRegion: "#footer-region"
   });
   
   
   vent.on('domChange:title', function(title){
      $(document).attr('title', title);
   });
   //Events for replacing content in div#main-region and div#header-region
   vent.on('mainRegion:show', function(view, callback){
      App.mainRegion.show(view);

      $(document).scrollTop(0);
   });
   
   
   var regionLoading = function(region){
      region.show(new LoadingSignView());
   }
   
   var regionDoneLoading = function(region){
      region.empty();
   }
   
   vent.on('mainRegion:deferredShow', function(promise, callback){
      //hide current videw
      regionLoading(App.mainRegion);
      promise
         .done(function(res){
            //regionDoneLoading(App.mainRegion);
            if(callback && 'success' in callback) callback.success(res);
         })
         .fail(function(mod, res){
            //regionDoneLoading(App.mainRegion);
            if(callback && 'error' in callback ) callback.error(mod);
         });
   });
   
   vent.on('region:deferredShow', function(region, promise, callback){
      regionLoading(region);
      promise
         .done(function(res){
            //regionDoneLoading(region);
            if(callback && 'success' in callback) callback.success(res);
         })
         .fail(function(mod, res){
            //regionDoneLoading(region);
            if(callback && 'error' in callback ) callback.error(mod);
         });
   });
   
   vent.on('headerRegion:show', function(view){
      App.headerRegion.show(view);
   });
   
   vent.on('mainRegion:close', function(){
      App.mainRegion.empty();
   });
   
   vent.on("footerRegion:show", function(view){
      App.footerRegion.show(view);
   });
   
   
   vent.on('all', function (evt, model) {
      console.log('DEBUG: Event Caught: ' + evt);
    });
   
   return App;
});
