define([
   'marionette',
   'vent',
   'reqres',
   'templates/UserProfileView',
   "text!messages/main/tpl-messages-header.html"
],
function (Marionette, vent, reqres, UserProfileView, MessageHeaderTpl) {
   'use strict';
     
   var MessagesHeaderView = Backbone.Marionette.LayoutView.extend({
      template: MessageHeaderTpl,
      tagName: 'div',
      className: 'message-header',
      events:{
         'click .post-link' : 'onPostLinkClick',
         'click .edit-post-link ': 'onEditPostClick'
      },
      initialize: function(options){
         this.control = options.control;
         this.model = this.control.getSelectedPost();
         this.listenTo(this.control,'change:postSelected', this.onChangePost);
      },
      serializeData: function(){
         if(!this.model){
            return {exists: false};
         }
         return _.extend(this.model.toJSON(),{
            exists: true
         });
      },
      regions:{
         chatListRegion: '#chat-list-region',
         ownerNameRegion: '.owner-name-region'
      },
      onRender: function(){
         if(!this.model){
            return;
         }
         if(!this.model.isOwner()){
            this.ownerNameRegion.show(new UserProfileView({
               user: {user_name: this.model.get('owner_name')}, 
               withPicture: false
            }));
         }
         if(!this.model.isSelling()){
            this.$(".img-circle").attr('title', this.model.get('owner_name')+' is looking for this item!').tooltip({
               placement: 'bottom'
            })
         } 
      },
      onChangePost: function(){
         //render post info
         this.model = this.control.getSelectedPost();
         this.render();
         this.delegateEvents();
      },
      onPostLinkClick: function(){
         if(this.model.get('deleted')){
            return alert("This post is already deleted!");
         }
         if(this.model.isSelling()){
            vent.trigger('navigate:posts:item', this.model.id); 
         }else{
            
         }
         
      },
      onEditPostClick: function(){
         if(this.model.get('deleted')){
            return alert("This post is already deleted!");
         }
         if(this.model.isSelling()){
            vent.trigger('navigate:posts:edit', this.model.id);
         }else{
            vent.trigger('navigate:buyRequests:edit', this.model.id);
         }
      }
   });
   
   
   return MessagesHeaderView;
});
