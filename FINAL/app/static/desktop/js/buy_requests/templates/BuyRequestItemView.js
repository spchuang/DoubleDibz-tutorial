define([
   'marionette',
   'vent',
   'templates/TimeagoView',
   'buy_requests/BuyRequestModel',
   'templates/HashtagsView',
   'text!buy_requests/templates/tpl-buy-request-list-item.html',

],
function (Marionette, vent, TimeagoView, BuyRequest, HashtagsView, BuyRequestItemTpl) {
   "use strict";

   var BuyRequestItemPageView = Marionette.LayoutView.extend({
      template: BuyRequestItemTpl,
      initialize: function(options){
         this.listenTo(this.model,'change:status', this.renderStatus, this);
      },
      ui:{
        toggleStatusBtn: '#toggle-status-btn'
      },
      regions:{
        timeago: '.timeago-region',
        hashtags: '.hashtags-region'
      },
      onRender: function(){
         this.renderStatus();   
         this.timeago.show(new TimeagoView({
             time: this.model.get('created_at'),
             showTooltip: true
          }));
          
          this.hashtags.show(new HashtagsView({
            hashtags: this.model.get('hashtags')
         }));
      },
      renderStatus: function(){
         //render btn
         if(this.model.is_active()){
            this.ui.toggleStatusBtn.text('Set to Bought');
         }else{
            this.ui.toggleStatusBtn.text('Set to Buying');
         }
      },
      events:{
         'click #edit-btn' : 'onEditClick',
         'click #delete-btn': 'onDeleteClick',
         'click .contact-owner': 'onContactClick',
         'click @ui.toggleStatusBtn': 'onToggleStatusClick',
      },
      onEditClick: function() {
         vent.trigger("navigate:buyRequests:edit", this.model.id);
      },
      onDeleteClick: function() {
         vent.trigger('buyRequests:deleteAttempt', this.model);
      },
      onContactClick: function() {
         vent.trigger("messages:contactSeller", this.model);
      },
      onToggleStatusClick: function(){
         this.model.toggleStatus();
      }
   });
   
   return BuyRequestItemPageView;
});
