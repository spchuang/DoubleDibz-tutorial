define([
   'marionette',
   'vent',
   'templates/TimeagoView',
   'text!messages/dropdown/tpl-inbox-dropdown-main.html',
   'text!messages/dropdown/tpl-inbox-dropdown-item.html',
   'jquery.slimscroll'
],
function (Marionette, vent, TimeagoView, PopMainTpl, PopItemTpl) {
   'use strict';
   
   var PopItem = Marionette.LayoutView.extend({
      template: PopItemTpl,
      tagName: 'li',
      events:{
         'click a': 'onClick'
      },
      regions:{
         itemTime: '.item-time'
      },
      initialize: function(options){
         this.listenTo(this.model, 'change:unread_count', this.render);
      },
      onRender: function(){
         this.itemTime.show(new TimeagoView({
            time: this.model.get('timestamp')
         }));
      },
      onClick: function(){
         vent.trigger('navigate:messages:post', this.model.id);
      }
   });
   
   var emptyView = Marionette.ItemView.extend({
      template: '<div style="padding:10px">No chats...</div>',
      tagName: 'li',
      className: 'empty-list'
   });
   
   var PopCollection = Marionette.CollectionView.extend({
      childView: PopItem,
      emptyView: emptyView,
      tagName: 'ul',
      initialize: function(options){
         this.collection = options.inbox.getChats();
      }
   });
   
   var InboxDropdownView = Marionette.LayoutView.extend({
      template: PopMainTpl,
      defaults:{
         boxHeight: '224px'
      },
      events:{
         'click #all-msg-link'   : 'onAllMsgClick'
      },
      initialize: function(options){
         this.inbox = options.inbox;
         
      },
      ui: {
         contentScroll: '.dropdown-content >div'
      },
      regions:{
         messagesWrap: '.dropdown-messges-wrap',
      },
      onRender: function(){
         this.ui.contentScroll.slimScroll({
            height: this.defaults.boxHeight,
            distance: '2px'
         });
         
         this.messagesWrap.show(new PopCollection({inbox: this.inbox}));
      },
      onAllMsgClick: function(){
         vent.trigger('navigate:messages');
      }
   });
   
   
   return InboxDropdownView;
});
