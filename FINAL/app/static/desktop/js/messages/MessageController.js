define([
   'marionette',
   'vent',
   'reqres',
   'backbone.poller',
   'messages/models/InboxCollection',
   'messages/models/InboxControl',
   'messages/CreateChatModal',
   "messages/main/MessagesLayoutView",
   "messages/dropdown/InboxDropdownView"
],
function (Marionette, vent, reqres, Poller, InboxCollection, InboxControl, CreateChatModal, MessagesLayoutView, InboxDropdownView) {
   
   'use strict';
   //create universal inbox 
   var pollingOptions = {
      delay: 5000,
      delayed: false,
      continueOnError: true,
      backoff: false,
   }
   
   var MessageController = Marionette.Controller.extend({
      initialize: function(){
         this.modal = null;
         this.view = null;
         
         // Singleton inbox collection
         this.inbox = new InboxCollection({});
         this.control = new InboxControl({inbox: this.inbox});
         this.inboxPoller = Poller.get(this.inbox, pollingOptions);;  
      },
      updateInbox: function(){
         //if the user changed state to logged in, then we fetch new collection for this guy, else empty it.
         if(reqres.request('isLoggedIn')) { 
            //start the poller
            this.inboxPoller.start();
         }else {
            this.inboxPoller.stop();
            this.inbox.reset();
         }
      },
      openContactSellerModal: function(post){
         if(this.modal) this.modal.remove();
         
         var that= this;
         this.modal = CreateChatModal({post_id: post.id});  
            
         //upon successful create chat, add it in the post chat list
         this.listenTo(this.modal, 'createChat:ok', function(chat){
            post.set({chat: new Array(chat)});
         });
      },
      showInbox: function(){
         vent.trigger('domChange:title', "Messages");
         var that = this;
         this.checkInboxPresent(function(){
            mc.control.selectFirstPost();
            vent.trigger('messages:updateurl');
            that.showMessagesPage();
         });
      },
      showMessagesPostFromURL: function(post_id){
         vent.trigger('domChange:title', "Messages");
         this.control.selectPost(post_id);
         var that = this;
         this.checkInboxPresent(function(){
            vent.trigger('messages:updateurl');
            that.showMessagesPage();
         });
      },
      checkInboxPresent: function(callback){
         var that = this;
         if(this.inbox.get("initialized")){
            if(callback) callback();
         }else{
            //guarantee the view has a updated inbox
            this.inboxPoller.once('success', function(model){
               if(callback) callback();
            });
         }
      },
      showMessagesPage: function(){
         //only show if we're not on the page
         if(!this.view || this.view.isDestroyed){
            vent.trigger('domChange:title', "Messages");
            this.view = new MessagesLayoutView({
                  control: this.control
            });
            vent.trigger('mainRegion:show', this.view);
         }
      },
   });

   var mc = new MessageController();
   var loginRequiredPages = [
      'showMessagesPage', 'checkInboxPresent' 
   ];
   
   reqres.request('session').setLoginRequired(mc, loginRequiredPages);
   
   mc.listenTo(vent, "app:start:auth:done", function(options){
      mc.updateInbox();
      //listen to change in session 
      mc.listenTo(reqres.request('session'), "change:logged_in", function(session){
         mc.updateInbox();
      });
   });
   
   mc.listenTo(vent, 'messages:contactSeller', function(post){
      //check if user is logged in or not first
      if(!reqres.request('isLoggedIn')){
         return vent.trigger('navigate:login');
      }
      
      var post_circle = post.get('joined_circles');
      if(!reqres.request('currentUser').isInCircle(post.get('joined_circles'))){
         return vent.trigger("flash:alert", {type: 'error', msg: "You need to be in the " + post_circle.name + " group to contact seller!"});         
      }
      
      //if the item is inactive, you can't contact the seller
      if(!post.is_active()){
         return vent.trigger("flash:alert", {type: 'error', msg: "Sorry, the post is sold already!!"});
      }
      
      if(post.get('has_contacted')){
         //send to the inbox view
         vent.trigger('navigate:messages:post', post.id);
      }else{
         //if buyer hasn't set up a chat with the seller
         mc.openContactSellerModal(post);
      }
   });
   
   mc.listenTo(vent, 'messages:updateurl', function(){
      if(mc.control.get('empty')){
         return Backbone.history.navigate('messages/');
      }
      Backbone.history.navigate('messages/'+ mc.control.get('postSelected'));
   });
   
   // Navigate API 
   mc.listenTo(vent, 'navigate:messages', function(){
      mc.showInbox();
   });
   
   mc.listenTo(vent, 'navigate:messages:post', function(post_id){
      mc.showMessagesPostFromURL(post_id);
   });
   
   mc.listenTo(vent, 'messages:send', function(chat, data, callback){
      if(!this.control.get('empty')){
         this.control.sendMessage(chat, data, callback);
      }
   });
   
   mc.listenTo(vent, 'messages:getPost', function(post_id, callback){
      mc.checkInboxPresent(function(){
         var p = mc.inbox.getPost(post_id);
         callback(p);
      });
   });
   
   //update header if inbox count changes
   mc.listenTo(mc.inbox, 'change:total_unread_count', function(){
      vent.trigger('messages:updateCount', mc.inbox.get('total_unread_count'));
   });
   
   reqres.setHandler('messages:dropdown', function(){
      return new InboxDropdownView({
         inbox: mc.inbox
      }).render();
   });
   
   
   
   return mc;

});
