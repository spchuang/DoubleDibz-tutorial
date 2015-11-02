define([
   'marionette',
   'vent',
   'templates/TimeagoView',
   'text!messages/main/tpl-messages-side.html',
   'text!messages/main/tpl-messages-side-item.html',
   'jquery.slimscroll'
],
function (Marionette, vent, TimeagoView, SideMainTpl, SideItemTpl) {
   'use strict';
   
   var sideItemPrefix = 'side-item-id-'
   
   var SideItemView = Marionette.LayoutView.extend({
      template: SideItemTpl,
      tagName: 'a',
      className: 'inbox-post-item',
      id: function(){
         return sideItemPrefix + this.model.id;
      },
      events:{
         'click': 'onClick'
      },
      regions:{
         itemTime: '.item-time'
      },
      initialize: function(options){
         this.listenTo(this.model, 'change:unread_count', this.updateRead);
      },
      onRender: function(){
         this.itemTime.show(new TimeagoView({
            time: this.model.get('timestamp')
         }));
      },
      onClick: function(){
         vent.trigger('navigate:messages:post', this.model.id);
      },
      updateRead: function(){
         this.render();
      }
   });
   
   var emptyView = Marionette.ItemView.extend({
      template: '<div style="padding:10px">No chats...</div>'
   });
   
   var SideListView = Marionette.CollectionView.extend({
      childView: SideItemView,
      emptyView: emptyView,
      initialize: function(options){
         this.control = options.control;
         this.collection = this.control.inbox.getChats();
         this.listenTo(this.control, 'change:postSelected', this.renderActiveItem);
      },
      onRender: function(){
         this.renderActiveItem();
      },
      renderActiveItem: function(){
         //render active side item
         this.$(".inbox-post-item").removeClass('active');
         this.$('#'+sideItemPrefix+this.control.get('postSelected')).addClass('active');
      }
   });
   
   var SideView = Marionette.LayoutView.extend({
      template: SideMainTpl,
      defaults:{
         boxHeight: '100%'
      },
      tagName: 'div',
      className: 'messages-side',
      initialize: function(options){
         this.control = options.control;
      },
      regions:{
         messagesRegion: '.messages-list-region' ,
      },
      onRender: function(){
         this.$('.messages-list-content').slimScroll({
            height: this.defaults.boxHeight,
            distance: '2px'
         });

         this.messagesRegion.show(new SideListView({control: this.control}));
      },
      onBeforeDestroy: function(){
         console.log("destroy inbox side view");
      }
   });
   
   
   return SideView;
});
