define([
   'marionette',
   'vent',
   'reqres',
   'posts/PostModel',
   'posts/templates/BookmarkButtonView',
   'text!posts/item/tpl-item-buyer-action.html'
],
function (Marionette, vent, reqres, Post, BookmarkButtonView, ItemHeaderBuyerTpl) {
   "use strict";
   
   var ItemHeaderBuyerTpl = Marionette.LayoutView.extend({
      template: ItemHeaderBuyerTpl,
      regions: {
         bookmarkBtn: '.bookmark-btn-region',
      },
      events:{
         'click #contact-btn':  'onContactClick',
         'click @ui.toggleSubscribeBtn': 'onToggleSubscribeClick'
      },
      ui:{
         toggleSubscribeBtn: '#toggle-subscribe-btn',
         subscribeLabel    : '#subscribe-label'
      },
      initialize: function(options){
         //this.listenTo(this.model,'change:has_subscribed', this.renderSubscribe, this);
         this.in_circle = reqres.request('currentUser').isInCircle(this.model.get('joined_circles'));
      },
      onRender: function(){
         this.bookmarkBtn.show(new BookmarkButtonView({model: this.model}));
         //this.renderSubscribe();
      },
      renderSubscribe: function(){
         var subscribe = this.model.get('has_subscribed');
         //render btn
         if(subscribe){
            this.ui.toggleSubscribeBtn.text('Unsubscribe');
            this.ui.subscribeLabel.empty().append('<span class="label label-danger">'+subscribe+'</span>');
         }else{
            this.ui.toggleSubscribeBtn.text('Subscribe');
            this.ui.subscribeLabel.empty().append('<span class="label label-success">'+subscribe+'</span>');
         }
      },     
      onContactClick: function(){
         vent.trigger("messages:contactSeller", this.model);
      },
      onToggleSubscribeClick: function(){
         if(!reqres.request('isLoggedIn')){
            return vent.trigger('navigate:login');
         }
      
         this.model.toggleSubscribe().fail(function(res){
            vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
         });         
      }
      
   });
   
   return ItemHeaderBuyerTpl;
});
