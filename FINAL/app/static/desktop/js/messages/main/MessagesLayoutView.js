define([
   'marionette',
   'vent',
   "messages/main/MessagesSideView",
   'messages/messageView/MessagesBoardView',
   'messages/main/MessagesHeaderView',
   'messages/postChats/PostChatsView',
   "text!messages/main/tpl-messages-layout.html",
],
function (Marionette, vent, MessagesSideView, MessageBoardView, MessagesHeaderView, PostChatsView, MessageLayoutTpl) {
   'use strict';
   
   var EmptyView = Marionette.ItemView.extend({
      template: "<div> </div>"
   });
   var LayoutView = Marionette.LayoutView.extend({
      tagName: 'div',
      className: 'messages-page-wrap',
      template: MessageLayoutTpl,
      regions:{
         sideRegion      : '.messages-side-region' ,
         headerRegion    : '.message-main-header-region',
         contentRegion   : '.content-region' ,
      },
      initialize: function(options){
         this.control   = options.control;
         this.listenTo(this.control,'change:postSelected', this.updateContent);
      },
      onRender: function(){
         this.sideRegion.show(new MessagesSideView({control: this.control}));
         this.headerRegion.show(new MessagesHeaderView({control: this.control}));
         this.updateContent();
         //
         //this.listenTo(this.control,'change:chatSelected', this.onChatSelected);
      },
      updateContent: function(){
         if(this.isDestroyed) {
            //return;
         }
         var post = this.control.getSelectedPost();
         
         if(!post){
            return this.contentRegion.show(new EmptyView());
         }
         // Depending on the selected post, we either show the message board directly or the chat list
         if(post.isOwner()){
            this.contentRegion.show(new PostChatsView({post: post}));
         }else{
            // get first chat
            this.contentRegion.show(new MessageBoardView({chat: post.get('chats').at(0)}));
         }
      },
      onBeforeDestroy: function(){
         this.control.reset();
         console.log("destroy inbox layout view");
         //clean up views
         //this.inbox.resetSelect();
      }
   });
   
   
   return LayoutView;
});
