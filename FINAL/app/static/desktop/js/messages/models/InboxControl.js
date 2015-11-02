define([
   'jquery',
   'marionette',
   'vent',
   'reqres',
],
function ($, Marionette, vent, reqres) {
   'use strict';
   /*
      This is used to control navigating in the inbox
   */ 
   var InboxControl = Backbone.Model.extend({
      defaults: function(){
         return {
            postSelected      : null,
            empty             : false
         }
      },
      initialize: function(options){
         //keep a reference of inbox
         this.inbox = options.inbox;
      },
      reset: function(){
         this.set(this.defaults(),{silent: true});
      },
      /*
         API for setting inbox navigation control
      */
      selectPost: function(post_id){
         
         if(post_id === this.get('postSelected')){
            // special case (if the post is owner, trigger change (so side view will update)
            if(this.getSelectedPost().isOwner()){
               this.trigger('change:postSelected');
            }
            
         }else{
            this.set({postSelected: post_id, empty: false});
         }
          
      },
      
      selectFirstPost: function(){
         var p = this.inbox.getPostAt(0);
         if(_.isUndefined(p)){
            //there is no posts
            this.set({empty: true});
         }else{
            this.selectPost(p.id);
            return p;
         }
      },
      selectFirstChat: function(){
         if(this.get('empty')) return;
         var c = this.getSelectedPost().get('chats').at(0);
         return c;
      },
      sendMessage: function(chat, data, callback){
         //send message to the current selected chat
         var p = this.getSelectedPost();
      
         var that = this;
         //add new message to collection
         chat.addMessage(data, function(model){
         
            if(callback) callback();
            //update post time
            p.get('chats').sort();
            p.updateTime();
            that.inbox.sort();
         }); 
      },
      
      /*
         API for retriving inbox data
      */
      getSelectedPost: function(){
         if(this.get('empty')) return null;
         var p = this.inbox.getPost(this.get('postSelected'));
         if(_.isUndefined(p)){
            p = this.selectFirstPost();
            vent.trigger('messages:updateurl');
         }
         return p;
      },
      getSelectedChat: function(){
         if(this.get('empty')) return null;
         
         var c= this.getSelectedPost().get("chats").get(this.get('chatSelected'));
         //set to first chat if c doesn't exist
         if(_.isUndefined(c)){
            c = this.selectFirstChat()
            vent.trigger('messages:updateurl');
         }
         return c;
      }
   });
   
   return InboxControl;
   
});
