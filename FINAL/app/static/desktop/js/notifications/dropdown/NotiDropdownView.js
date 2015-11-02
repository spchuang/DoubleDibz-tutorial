define([
   'jquery',
   'marionette',
   'vent',
   'templates/TimeagoView',
   'text!notifications/dropdown/tpl-noti-dropdown-item.html',
   'text!notifications/dropdown/tpl-noti-dropdown-main.html',
   'jquery.slimscroll',
],
function ($, Marionette, vent, TimeagoView, NotiDropdownItemTpl, NotiDropdownMainTpl) {
   'use strict';
   /*
   glyphicon glyphicon-pencil
   POST_EDIT: 'post_edit',
   POST_STATUS_SOLD: 'post_status_sold',
   POST_STATUS_SELLING: 'post_status_selling',
   
   glyphicon glyphicon-remove
   POST_DELETE: 'post_delete',
   
   glyphicon glyphicon-comment
   POST_COMMENT: 'post_comment',
   
   glyphicon glyphicon-envelope
   CONTACT_SELLER: 'contact_seller'
   */
   var ICON = {
      'post_edit'           : 'glyphicon-pencil',
      'post_status_inactive': 'glyphicon-pencil',
      'post_status_active'  : 'glyphicon-pencil',
      'post_delete'         : 'glyphicon-remove',
      'post_comment'        : 'glyphicon-comment',
      'contact_seller'      : 'glyphicon-envelope',  
   };
   
   var getIcon = function(action_type, object_id){
      
      if(action_type === 'system_notification' ){
         if(object_id === 0){
            // WELCOME NOTIFICATION
            return 'fui-user';
         }else {
            return 'fui-gear';
         }
      }
      return ICON[action_type];
   }
   
   var ItemView = Marionette.LayoutView.extend({
      template: NotiDropdownItemTpl,
      tagName: 'li',
      events:{
         'click a': 'onClick'
      },
      regions: {
         itemTime: '.item-time' 
      },
      serializeData: function(){
         return _.extend({}, this.model.toJSON(), {
            icon: getIcon(this.model.get('action_type'), this.model.get('object_id'))
         })
      },
      initialize: function(options){
         this.listenTo(this.model, 'change:has_read', this.render);

      },
      onRender: function(){
         this.itemTime.show(new TimeagoView({
            time: this.model.get('modified_at')
         }));
      },
      onClick: function(){
         vent.trigger('notifications:click', this.model);
      }
   });
   
   var emptyView = Marionette.ItemView.extend({
      template: '<div style="padding:10px">No notifications...</div>',
      tagName: 'li',
      className: 'empty-list'
   });
   
   var ListView = Marionette.CollectionView.extend({
      childView: ItemView,
      emptyView: emptyView,
      tagName: 'ul',
      initialize: function(options){
         this.collection = options.notifications;
      }
   });
   
   var NotiDropdownView = Marionette.LayoutView.extend({
      template: NotiDropdownMainTpl,
      defaults:{
         boxHeight: '300px'
      },
      initialize: function(options){
         this.notifications = options.notifications;
         this.listenTo(this.notifications, 'notification:end', _.bind(this.onEnd, this));
      },
      ui: {
         'loader': '.notif-loader',
         'wrap'  : '.notif-dropdown-wrap'
      },
      regions:{
         content: '.notif-dropdown-list' ,
      },
      onScroll: function(e, pos){
         if(pos === 'bottom'){
            this.notifications.loadNext();
         }
      },
      onEnd: function(){
         this.ui.loader.addClass('hidden'); 
      },
      onRender: function(){
         //create scrolling
         this.ui.wrap.slimScroll({
            height: this.defaults.boxHeight,
            distance: '2px'
         });
         
         this.ui.wrap.slimScroll().bind('slimscroll', _.bind(this.onScroll, this));
         
         
         this.content.show(new ListView({notifications: this.notifications.get('list')}));
      },
      onBeforeDestroy: function(){
          this.ui.wrap.off("scroll");
      }
      
   });
   
   
   return NotiDropdownView;
});
