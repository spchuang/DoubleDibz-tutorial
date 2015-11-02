define([
   'marionette',
   'vent',
   'reqres',
   'search/SearchModel',
   'posts/PostModel',
   "search/SearchPageView",
   "posts/item/PostItemPageView",
   'posts/fbpost/FBPostView'
],
function (Marionette, vent, reqres, SearchModel, Post, SearchPageView,PostItemPageView, FBPostView) {
   "use strict";
      
   var parseArgString = function(argString){
      if(_.isNull(argString)){
         return {}
      }
      // convert "page=2&name=test" to {page: 2, name: 'test'}
      return _.object(_.map(argString.split("&"), function(p){
         return p.split("=");
      }));
   }
   
   var SearchController = Marionette.Controller.extend({
      initialize: function(){
         this.view = null; 
      },
      showDailyListingPage: function(){
         this.showSearchPage("ucla", {from: 'today'});
      },
      showSearchPageFromUrl: function(circle, argsString){
         this.showSearchPage(circle, parseArgString(argsString));
      },
      showSearchPage: function(circle, args, callback){
         vent.trigger('domChange:title', reqres.request('page:name').search);
         var search = new SearchModel(circle, args);
         if(callback) callback(search.createHistoryUrl().join("&"));
         
         // if we came from another page, create search view
         if(!this.view || this.view.isDestroyed) {
            this.view = new SearchPageView({search: search});
            vent.trigger('mainRegion:show', this.view);
         }else{
            this.view.updateSearch(search);
            this.view.onShow();
         }
      }
   });
   
   var sc = new SearchController();
   vent.on('navigate:search', function(circle, args){
      args = args || {};
      circle = circle || "ucla";
      sc.showSearchPage(circle, args, function(argsString){
         Backbone.history.navigate('/' + circle + "?" + argsString);
      });
   });
   
   
   vent.on('navigate:search:home', function(circle, page, junk, order){
      sc.showSearchPage(circle, {page: page, order: order}, function(argsString){
         Backbone.history.navigate('/' + circle + "?" + argsString);
      });
   
   });
   
   //assuming we can only search though names
   vent.on('navigate:search:name', function(circle, page, name, order){
      sc.showSearchPage(circle, {page: page, name:name, order: order}, function(argsString){
         Backbone.history.navigate('/' + circle + "?" + argsString);
      });
   
   });
   
   //Handler for hashtag searching (also used for category)
   vent.on('navigate:search:hashtag', function(circle, page, hashtag, order){
      sc.showSearchPage(circle, {page: page, hashtag:hashtag, order: order}, function(argsString){
         Backbone.history.navigate('/' + circle + "?" + argsString);
      });
   });
   
   vent.on('open:modal:post', function(model, fromURL){
      fromURL = fromURL || Backbone.history.fragment;
      model.collection.setElement(model);
      if(!model.is_fb()){
         model.modalMode = true;
         vent.trigger('open:modal', new PostItemPageView({model: model, fromURL: fromURL}), {
            dialogClass: 'post-modal',
            animate: false
         });
         
      }else{
         vent.trigger('open:modal', new FBPostView({model: model, fromURL: fromURL}), {
            dialogClass: 'post-modal',
            animate: false
         });
      }
   });
   
   vent.on('open:modal:first:post', function(){
      var model = sc.view.collection.first();
      if(!model.is_fb()){
         model.modalMode = true;
         vent.trigger('open:modal', new PostItemPageView({model: model}), {
            dialogClass: 'post-modal',
            animate: false
         });
         
      }else{
         vent.trigger('open:modal', new FBPostView({model: model}), {
            dialogClass: 'post-modal',
            animate: false
         });
      }      
   });
   
   return sc;
});


