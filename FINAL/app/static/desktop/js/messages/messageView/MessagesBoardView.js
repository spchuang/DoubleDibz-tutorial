define([
   'backbone',
   'marionette',
   'vent',
   'reqres',
   'templates/TimeagoView',
   'templates/LoadingSignView',
   'messages/messageView/MessageForm',
   'messages/messageView/MessageInputView',
   "text!messages/messageView/tpl-messages-board-item.html",
   'jquery.slimscroll'
],
function (Backbone, Marionette, vent, reqres, TimeagoView, LoadingSignView, MessageForm, MessageInputView, MessageItemTpl) {
   'use strict';
   var MessageView = Marionette.LayoutView.extend({
      template: MessageItemTpl,
      tagName: 'div',
      className: 'message-item',
      regions:{
         timeago: '.timeago-region'
      },
      onRender: function(){
         this.timeago.show(new TimeagoView({
            time: this.model.get('created_at')
         })); 
      }
   });
   
   var MessageListView = Marionette.CollectionView.extend({
      childView: MessageView,
      tagName: 'div',
      className: 'message-board',
      initialize: function(options){
         this.rendered = false;
         this.container = options.container;
      },
      onRender:function(){
         this.rendered = true;
      },
      scrollBot: function(){
         var height = $(this.el).height();
         this.container.slimScroll({scrollTo: height});
      },
      onAddChild: function(){
         if(this.rendered){
            this.scrollBot();
         }
      }
   });
   
   var MessageBoardView = Marionette.LayoutView.extend({
      tagName: 'div',
      template: "<div class='messages-container'></div> \
                  <div class='message-main-input-region'></div>",
      regions:{
         container : '.messages-container',
         inputRegion : '.message-main-input-region'
      },
      ui:{
         noChatView: '.no-chat' 
      },
      defaults:{
        height: '400px' 
      },
      initialize: function(options){
         this.chat    = options.chat;
         this.inputView = new MessageInputView();
         
         this.listenTo(this.inputView, 'messageSubmit', this.sendMessage);
         if(this.chat){
            this.listenTo(this.chat, 'change:read', this.onChatUpdate);
         }
         
         this.msgView = null;
      },
      onShow: function(){
         this.$('.messages-container').slimScroll({
            height: this.defaults.height,
            distance: '2px'
         }).closest('.slimScrollDiv').css({height: this.defaults.height});
         this.fetchMessages();
         
         this.inputRegion.show(this.inputView);
      },
      updateChat: function(chat){
         if(this.chat){
            if(this.chat.get('id') == chat.get('id')) return;
            this.stopListening(this.chat);
         }
         this.chat = chat;
         this.inputView.resetForm();
              
         //listen to unread changes, so we can update the view
         this.listenTo(this.chat, 'change:read', this.onChatUpdate);
         this.fetchMessages();
      },
      onChatUpdate: function(){
         if(!this.chat) return;
         if(!this.chat.hasRead()){ 
            this.fetchMessages();
         }
      },
      fetchMessages: function(){
         if(!this.chat) return;
         
         var that = this;
         that.container.show(new LoadingSignView());
         this.chat.fetchMessages().done(function(messages){
            if(!that.container) {
               return;
            }
            //we need to initialize view with collection so that it listens to message events
            that.msgView = new MessageListView({collection: messages, container: that.$('.messages-container')});
            
            that.container.show(that.msgView);
            that.msgView.scrollBot(); 
         });
      },
      sendMessage: function(data, callback){
         vent.trigger("messages:send", this.chat, data, callback);           
      },
      
      onBeforeDestroy: function(){
         console.log("destroy Message board view");
      },
      
   });

   return MessageBoardView;
});
