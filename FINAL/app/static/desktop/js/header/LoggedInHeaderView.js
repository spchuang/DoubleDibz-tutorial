define([
    'jquery',
    'underscore',
    'marionette', 
    'app',
    'vent',
    'reqres',
    'header/BaseView',
    "text!header/tpl-logged-in-header.html",
], function($, _, Marionette, App, vent, reqres, BaseView, LoggedInHeaderTpl){
   'use strict';



   var LoggedInHeaderView = BaseView.extend({
      template: LoggedInHeaderTpl,
      ui: _.extend({},BaseView.prototype.ui,{
         inboxBubble    : '#inbox-link .unread-bubble',
         notiBubble     : '#noti-link .unread-bubble',
         profileImg     : '.header-profile-picture',
         inboxDropdown  : '.dropdown-inbox',
         notiDropdown  : '.dropdown-notification',
         navProfile    : '#nav-profile'
      }),
      events: _.extend({},BaseView.prototype.events,{
         'click #settings-link'  : 'onSettingsClick',
         'click #logout-link'    : 'onLogoutClick',
         'click #posts-link'     : 'onPostsClick',
         'click #create-post-link': 'onCreatePostClick',
         'click #bookmarks-link' : 'onBookmarkClick',
         'click #create-buy-request-link' : 'onCreateRequestClick', 
         'click #report-btn'     : 'onReportBugClick',
         'click #invite-btn'    : 'onInviteClick',
         'mouseover @ui.navProfile'   : 'overProfile',
         'mouseout @ui.navProfile'    : 'outProfile'
      }),
      initialize: function(options){
         BaseView.prototype.initialize.apply(this);    
         
         this.model = options.user; 
         this.listenTo(this.model, 'change:picture', this.updatePicture);
      
         
         this.inboxSet = false;
         
         this.navProfileTimer = null;
      },
      updatePicture: function(){
         this.ui.profileImg.attr('src', this.model.get('picture_thumb'));
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
            //that.ui.inboxDropdown.siblings('.dropdown-toggle').dropdown('toggle').blur();
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
            //that.ui.notiDropdown.siblings('.dropdown-toggle').dropdown('toggle').blur();
         })
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
      onRender: function(){
         this.renderInboxDropdown();
         this.renderNotiDropdown();
      },
      onReportBugClick: function(){ 
         vent.trigger('open:reportbug');
      },
      onSettingsClick: function(){
         vent.trigger('navigate:account:settings');
      },
      onLogoutClick: function(){
         vent.trigger('auth:logoutAttempt');
      },
      onCreatePostClick: function(){
         vent.trigger('navigate:createPost');
      },
      onCreateRequestClick: function(){
         vent.trigger('navigate:createBuyRequest');
      },
      onBookmarkClick: function(){
         vent.trigger("navigate:account:bookmarks"); 
      },
      onPostsClick: function(){
         vent.trigger("navigate:account:posts");
      },
      overProfile: function(){
         if(this.navProfileTimer){
            clearTimeout(this.navProfileTimer);
         }
         this.ui.navProfile.addClass('open');
      },
      outProfile: function(){
         var that = this;
         this.navProfileTimer = setTimeout(function() {
            that.ui.navProfile.removeClass('open');
         }, 200);
      },
      onDestroy: function(){
         clearTimeout(this.navProfileTimer);
      },
      onInviteClick: function(){
         vent.trigger('open:inviteFriends');
      }
      
   });

   return LoggedInHeaderView;
});
