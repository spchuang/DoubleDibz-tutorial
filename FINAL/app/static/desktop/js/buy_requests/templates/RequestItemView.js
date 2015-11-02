define([
   'marionette',
   'vent',
   'buy_requests/BuyRequestModel',
   'text!buy_requests/templates/tpl-request-list-item.html',

],
function (Marionette, vent, BuyRequest, RequestItemTpl) {
   "use strict";

   var ItemRequestPageView = Marionette.ItemView.extend({
      template: RequestItemTpl,
      initialize: function(options){
         
      },
      ui:{
        timeago: '.timeago'
      },
      events:{
         'click #item-request-link': 'showBuyRequest'
      },
      showBuyRequest: function(){
         var id = this.model.id;
         //vent.trigger('navigate:requests:item', id);
      } 
      
   });
   
   return ItemRequestPageView;
});
