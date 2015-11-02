define([
   'reqres',
   'backbone',
   'underscore',
   'messages/models/ChatModel'
], function(reqres, Backbone, _, ChatModel){
   'use strict';
   //HELPER
   //iterate through the chats to count how many are unread
   var get_unread_count = function(chats){
      var count = 0;
	   _.each(chats, function(chat){
         if(chat.read == 0) count ++;
      });
      return count;
   }
   
   
   var ChatCollection = Backbone.Collection.extend({
      model : ChatModel,
      comparator : function(item){
         //compare with chat's modified time in Desc order (latest first)
         //return item.time;
         return -item.get('time');
      }
   });
   
   
   var PostChatModel = Backbone.Model.extend({
      initialize: function(options){
         this.updateTime();
         this.listenTo(this.get('chats'), "change:read", _.bind(this.updateCount, this)); 
         
         // check if post is deleted
         if(!this.get('ref_id')){
            this.set({});
            this.set({
               deleted: true,
               image: {
                  link: '/static/img/post_deleted2.png',
                  thumbnail: '/static/img/post_deleted2.png'
            }});
         }else {
            this.set({deleted: false});
         }
         
         // for now, post with no images but has id is a buy request (this could change if we allow normal post to not have images)
         if(!this.get('image') && !this.get('deleted')){
            this.set({
               type: 'buying',            
               image: {
                  link: '/static/img/looking.png',
                  thumbnail: '/static/img/looking.png'
            }});
         }else{
            this.set({type: 'selling'});
         }
      },
      updateTime: function(){
         this.set({
            time : this.get('chats').models[0].get('time'),
            timestamp: this.get('chats').models[0].get('modified_at')
         });
      },
      updateCount: function(){
         //loop through all the chats
         var c = get_unread_count(this.get("chats").toJSON());
         this.set({unread_count: c});
      },
      isOwner: function(){
         return this.get('owner_name') === reqres.request('currentUser').get('user_name');
      },
      isSelling: function(){
         return this.attributes.type === 'selling';
      },
      toJSON: function(){
         return {
   		   id          : this.attributes.id,
   		   chats       : this.attributes.chats.toJSON(),
   		   post_name   : this.attributes.post_name,
   		   owner_name  : this.attributes.owner_name,
   		   unread_count: this.attributes.unread_count,
   		   has_unread  : this.attributes.unread_count>0,
   		   image       : this.attributes.image,
   		   timestamp   : this.attributes.timestamp,
   		   isOwner     : this.isOwner(),
   		   deleted     : this.attributes.deleted,
   		   is_selling  : this.isSelling()
		   };
      }
      
   });
   
   var PostChatCollection = Backbone.Collection.extend({
      model: PostChatModel,
      comparator : function(item){
         return -item.get('time');
      }
   });
   

   var InboxCollection = Backbone.Model.extend({
      defaults: function(){
         return {
            chats             : new PostChatCollection,
            total_unread_count: 0,
            initialized       : false
         }
      },
      url: function(){
         return reqres.request('api').chat; 
      },
      reset: function(){ 
         //clear the chat data
         this.getChats().reset();
         this.clear().set(this.defaults());
         //stop listening to changes
         this.stopListening();
      },
      updateTotalUnread: function(){
         //loop through both list to get unread count
         var c = 0;
         this.getChats().each(function(chat_post){
            c+=chat_post.get('unread_count');
         });
         this.set({total_unread_count: c});
      },
      getChats: function(){
         return this.get('chats'); 
      },
      getPost: function(post_id){
         return this.get('chats').get(post_id);
      },
      getPostAt: function(id){
         return this.get('chats').at(id); 
      },
      addPost: function(new_post){
         return this.get('chats').add(new_post); 
      },
      sort: function(){
         this.get('chats').sort(); 
      },
      parse: function(response, options){
         if(!this.get('initialized')){
            this.get('chats').on("change:unread_count", this.updateTotalUnread, this);
         }
      
         this.set({initialized: true});
         /*
            HELPER FUNCTION 
            prase through the data (we don't just dump the chats because messages could be lost
            - intelligently add only the posts or chats that haven't been added
            - set the 'read' status and modifed time for chat that changed
		   */
		   
		   //returnns the total unread count
         var smart_merge = function(data, that){
            var total_unread = 0;
            if(_.isEmpty(data)){
               return total_unread;
            }
            
            //iterate through the data  
		      _.each(data, function(chat_post, post_id){
		         var chats = chat_post['chats'];
		         
		         var post = that.getPost(post_id);
               //if post_id doesn't exist in current list, then add it
               if(!post){
                  var c = get_unread_count(chats);
                  //NOTE: just use the first chat owner name
                  var p = that.addPost({
                        id          : post_id,
                        ref_id      : chat_post.id,
                        chats       : new ChatCollection(chats),
                        post_name   : chat_post.name, 
                        owner_name : chats[0].owner_name,
                        unread_count: 0,
                        image       : chat_post.image
                     });
                     
                  p.updateCount();
                     
                  //listen to changes on chat read
               }else{
                  //else, iterate through the chats, 
                  _.each(chats, function(data_chat){     
                     //find if the chat exists               
                     var chat = post.get('chats').get(data_chat.id);
                     
                     if(!chat){
                        //if chat doesnt exist, add it
                        post.get('chats').add(data_chat, {sort: false});
                     }else{
                        //if chat exist, update its attributes (read status and modified time)
                        chat.update(data_chat);
                     }
                  });
         		   //resort chat (since updating attribute doesn't trigger sort)
         		   post.get('chats').sort();
         		   
         		   //renew time
         		   post.updateTime();
   		      }
		      });
   		   //sort the chat posts by latest time
   		   that.sort();
   		   
         }       
		   var data = Backbone.Model.prototype.parse(response, options);
         
		   smart_merge(data, this);
         //this.get('selling')[1].chats.sort();
         //console.log(this.get('selling')[1].chats.pluck('id'));
         //console.log(this.get('selling').pluck('post_name'));
         //console.log(this.get('selling').pluck('time'));
         //console.log(this.get('selling').pluck('id'));
		},
		//deep conversion for nested chats too
		toJSON: function(){
         return {
            chats : this.attributes.chats.toJSON(),
            total_unread_count : this.attributes.total_unread_count
         }
		  
		}
      
   });
   
   return InboxCollection;
});
