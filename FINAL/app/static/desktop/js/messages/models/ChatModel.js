define([
   'reqres',
   'backbone',
   'underscore',
], function(reqres, Backbone, _){
   'use strict';
   var MessageModel  = Backbone.Model.extend({
      is_owner: function(){
         
         return this.get('created_by') == reqres.request('currentUser').id; 
      },
      name: function(){
         if(this.collection) return this.collection.contactName; 
      },
      toJSON: function(){
         return _.extend({}, this.attributes, {
            is_owner: this.is_owner(),
            name: this.name()
         });
      }
   }); 
   var MessageCollection  = Backbone.Collection.extend({
		initialize: function () {
		
		},
		parse: function(response, options){
   		return response.data.messages;
		},
		model : MessageModel
   }); 
   
   var ChatModel  = Backbone.Model.extend({
      
		initialize: function (options) {
         //convert timestamp to Date instnace
    
         if(options && options.modified_at){
            this.set({ time: new Date(options.modified_at)});
         }
		},
		toJSON: function(){
   		return _.extend({}, this.attributes, {
      		is_unread: !this.hasRead()
   		});
		},
		urlRoot: function(){
   		return reqres.request('api').chat; 
		},
		hasRead: function(){
   		return this.get('read') == 1;
		},
		setToRead: function(){
         this.set({read: 1});
		},
		fetchMessages: function(){
		   /*
		      Return a promise that should resolve to chat messages. 
		   */
		   var dfd = new $.Deferred();
         var that = this;
		   
   		if(!this.has('messages') || !this.hasRead()){
   		   //first decrement read count
   		   if(!this.hasRead()) this.setToRead();
   		 
   		   //fetch data only if we don't have messages or if the chat hasn't been read (there's updates)
      		this.fetch().done(function(){
      		   dfd.resolve(that.get('messages'));
            });
   		}else{
      		//we already have the messages
            dfd.resolve(this.get('messages'));  
   		}
   		
   		return dfd.promise();
		},
		parse: function(response, options){
		   var r = Backbone.Model.prototype.parse(response, options);

         var messages = null;
         //convert each message attriute into a collection of message models
         if(_.isArray(r.messages)){
            messages = new MessageCollection(r.messages);
            //set the url for creating new messages
            messages.url = this.urlRoot()+'/'+this.id;
            
            //determine contact person name. If user is contact user, it must be talkign to the owner. vice versa
            if(r.contact_name === reqres.request('currentUser').get('user_name')){
            
               messages.contactName = r.owner_name;
            }else{
               messages.contactName = r.contact_name;
            }
         }
         
         //update messages and read status
         this.set({messages: messages});
         
		},
		addMessage: function(data, callback){
   		var msg = new MessageModel();
   		msg.url = this.get('messages').url;
   		var that = this;
   		
   		msg.save(data,{
            wait: true,
            success: function (model, res) {
            
               that.get('messages').add(model);
               //set chat time
               that.set({
                  modified_at: model.get('created_at'),
                  time: new Date(model.get('created_at'))
               });
               
               if(callback) callback(model);
            }
         }); 
		},
		update: function(data){
   		this.set({
            read: data.read,
            modified_at: data.modified_at,
            time: new Date(data.modified_at)
         });
		}
   });
       
   return ChatModel;
});
