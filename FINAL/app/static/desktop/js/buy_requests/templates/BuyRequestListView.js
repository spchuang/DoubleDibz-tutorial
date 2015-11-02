define([
   'marionette',
   'vent',
   'buy_requests/BuyRequestModel',
   'buy_requests/templates/BuyRequestItemView'
],
function (Marionette, vent, BuyRequest, BuyRequestItemView) {
   "use strict";
   var NoChildsView = Backbone.Marionette.ItemView.extend({
     template: "<p>No buy requests...</p>"
   });
   var EmptyCreateNewView = Backbone.Marionette.ItemView.extend({
     template: '<a class="create-new"> \
                  <span class="glyphicon glyphicon-plus"></span>\
                </a>',
      events: {
         'click .create-new': function(){
            vent.trigger('navigate:createBuyRequest');
         }
      },
      onRender: function(){
         this.$('.create-new').attr('title', 'Looking for an item?').tooltip({
            placement: 'bottom'
         });
      }
   });
   var BuyRequestListPageView = Marionette.CompositeView.extend({
      template: '<div class="request-list-wrapper col-xs-12"></div>',
      childView: BuyRequestItemView,
      emptyView: NoChildsView,
      childViewContainer: ".request-list-wrapper",
      getEmptyView: function(){
         // if we're the owner of the page, then show "create new post" icon
         if(this.is_owner){
            return EmptyCreateNewView;
         }
         return NoChildsView;
      },
      initialize: function(options){
         this.is_owner = options.is_owner || false;
      },   
   });
   
   return BuyRequestListPageView;
   
});
