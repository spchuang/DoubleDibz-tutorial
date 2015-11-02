define([
   'backbone',
   'marionette',
   'vent',
   'reqres',
   'buy_requests/BuyRequestModel',
   "buy_requests/edit/BuyRequestCreatePageView",
   "buy_requests/edit/BuyRequestEditPageView",
   "buy_requests/templates/BuyRequestListView",
],
function (Backbone, Marionette, vent, reqres, BuyRequest, BuyRequestCreatePageView, BuyRequestEditPageView, BuyRequestListPageView) {
   "use strict";
   
   var BuyRequestController = Marionette.Controller.extend({
      initialize: function(options){
         
      },
      
      showCreateBuyRequestPage: function(){
         vent.trigger('domChange:title', reqres.request('page:name').create);
         var page = new BuyRequestCreatePageView({
            categories: reqres.request('categories'),
            model: new BuyRequest.model()
         });
         vent.trigger('mainRegion:show', page);
      },
      
      showEditBuyRequestPage: function(id){
         vent.trigger('domChange:title', reqres.request('page:name').editItem);
         /*
            This page should only be allowed for buy request owners
         */
         var model = new BuyRequest.model({id:id});
         var that  = this;
         
         var promise = model.fetch();
         vent.trigger("mainRegion:deferredShow", promise, {
            success: function(res){
               if(!model.is_owner()){
                  return vent.trigger('navigate:404Page');
               }
               
               vent.trigger('mainRegion:show', new BuyRequestEditPageView({
                  categories: reqres.request('categories'),
                  model: model
               }));
            }
         });
      },
      
      showBuyRequestListPage: function(){ 
         vent.trigger('domChange:title', reqres.request('page:name').myposts);
         var buy_requests = new BuyRequest.collection();
         
         var promise = buy_requests.fetch();
         vent.trigger("mainRegion:deferredShow", promise, {
            success: function(res){
               var page = new BuyRequestListPageView({
                  collection: buy_requests
               });
               vent.trigger('mainRegion:show', page)
            }
         });
         
      }, 
      
      deleteAttempt: function(buy_request, callback){
         var r = confirm("Are you sure you want to delete this?");
         if (r == false) return;
         buy_request.destroy({
            wait: true,
            success: function(model, res){
               vent.trigger("navigate:account:posts");
               if(callback) callback();
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(model, res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      }  
      
   });
   
   var brc = new BuyRequestController();
   
   
   var loginRequiredPages = [
      'showCreateBuyRequestPage',
      'showEditBuyRequestPage'
   ];
   
   reqres.request('session').setLoginRequired(brc, loginRequiredPages);
   
   brc.listenTo(vent, 'buyRequests:deleteAttempt', function(request){
      brc.deleteAttempt(request);
   });
   
   brc.listenTo(vent,"navigate:createBuyRequest", function(){
      brc.showCreateBuyRequestPage();
      Backbone.history.navigate('buy_requests/create');
   });
   
   brc.listenTo(vent,"navigate:buyRequests:edit", function(id){
      brc.showEditBuyRequestPage(id);
      Backbone.history.navigate('buy_requests/'+id+'/edit');
   });

   brc.listenTo(vent,"navigate:buyRequests:list", function(){
      brc.showBuyRequestListPage();
      Backbone.history.navigate('buy_requests/list');
   });
   
   return brc;
});


