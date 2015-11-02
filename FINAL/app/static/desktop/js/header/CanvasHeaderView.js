define([
    'jquery',
    'underscore',
    'marionette', 
    'app',
    'vent',
    'reqres',
    'header/BaseView',
    "text!header/tpl-canvas-header.html",
], function($, _, Marionette, App, vent, reqres, BaseView, CanvasHeaderTpl){
   'use strict';

   var CanvasHeaderView = Marionette.ItemView.extend({
      template: CanvasHeaderTpl,
      ui: {
         inboxBubble    : '#inbox-link .unread-bubble',
         notiBubble     : '#noti-link .unread-bubble',
         profileImg     : '.header-profile-picture',
         inboxDropdown  : '.dropdown-inbox',
         notiDropdown  : '.dropdown-notification'
      },
      events: {
        'click #posts-link'     : 'onPostsClick' 
      },
      initialize: function(options){  
         this.model = options.user; 
         this.inboxSet = false;
         this.listenTo(this.model, 'change:picture', this.updatePicture);
      },
      onRender: function(){
         this.renderInboxDropdown();
         this.renderNotiDropdown();
      },
      updatePicture: function(){
         this.ui.profileImg.attr('src', this.model.get('picture_thumb'));
      },
      updateInboxCount: function(new_count){
         this.ui.inboxBubble.text(new_count)
         if(new_count === 0){
            this.ui.inboxBubble.addClass('hidden');
         }else{
            this.ui.inboxBubble.removeClass('hidden');
         }
      },
      updateNotiCount: function(new_count){
         this.ui.notiBubble.text(new_count)
         if(new_count === 0){
            this.ui.notiBubble.addClass('hidden');
         }else{
            this.ui.notiBubble.removeClass('hidden');
         }
      },
      renderInboxDropdown: function(){
         this.inboxPopView = reqres.request('messages:dropdown');
         this.ui.inboxDropdown.append(this.inboxPopView.el);
         
         this.ui.inboxDropdown.on('click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
         });
         
         var that = this;
         this.listenTo(vent, 'navigate:messages:post navigate:messages', function(){
            that.ui.inboxDropdown.parent().removeClass('open').blur();
         })
      },
      renderNotiDropdown: function(){
         this.notifView = reqres.request('notifications:dropdown');
         this.ui.notiDropdown.append(this.notifView.el);
         this.ui.notiDropdown.on('click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
         });
         
         var that = this;
         this.listenTo(vent, 'notifications:click', function(){
            that.ui.notiDropdown.parent().removeClass('open').blur();
         })
      },
      onPostsClick: function(){
         vent.trigger("navigate:account:posts");
      },
      onSettingsClick: function(){
         vent.trigger('navigate:account:settings');
      },
      onBookmarkClick: function(){
         vent.trigger("navigate:account:bookmarks"); 
      }
   });

   return CanvasHeaderView;
});
