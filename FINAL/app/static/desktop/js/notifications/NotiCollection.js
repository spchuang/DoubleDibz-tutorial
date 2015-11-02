define([
   'reqres',
   'backbone',
   'underscore',
], function(reqres, Backbone, _, ChatModel){
   'use strict';
   
   var Item = Backbone.Model.extend({
		setToRead: function(){
		   if(! this.hasRead()){
   		   this.set({has_read: 1});
            this.trigger('notification:read');
            
            //set in the server too
            var opts = {url: reqres.request('api').notification+'/'+this.id+'/read', method: 'PUT'};
            this.ajax({}, opts);
		   }
		},
		hasRead: function(){
   		return this.get('has_read') == 1;
		},
		initialize: function(options){
         this.updateTime();
        
      },
      getType: function(){

         var action = this.get('action_type');
         if(_.indexOf(['post_edit', 'post_status_inactive', 'post_status_active', 'post_comment'], action) !== -1 ){
            return 'post';
         }else if(_.indexOf(['contact_seller'], action) !== -1 ){
            return 'chat';
         }else if(_.indexOf(['post_delete'], action) !== -1){
            return 'none';
         }else if(_.indexOf(['system_notification'], action) !== -1){
            return 'system_notification';
         }
      },
      updateTime: function(){
         this.set({
            time : new Date(this.get("modified_at"))
         });
      },
   
   });
   
   var List = Backbone.Collection.extend({
      model: Item,
		comparator : function(item){
         //compare with chat's modified time in Desc order (latest first)
         return -item.get('time');
      }
      
   });
   
   var NotiCollection = Backbone.Model.extend({
      defaults: function(){
         return {
            list              : new List,
            total_unread_count: 0,
            initialized       : false,
            next_page         : 1,
            page              : 1
         }
      },
      url: function(){
   		return reqres.request('api').notification; 
		},
		reset: function(){ 
         //clear the chat data
         this.get('list').reset();
         this.clear().set(this.defaults());
         this.stopListening();
      },
      updateTotalUnread: function(count){
         this.set({total_unread_count: parseInt(count)});
      },
      decrCount: function(){
         this.set({total_unread_count: this.attributes.total_unread_count - 1});
      },
      loadNext: function(){
         if(this.get('next_page') > this.get('page')){
            this.fetch({url: this.url() + '?page=' + this.get('next_page')});
            this.attributes.page = this.attributes.next_page;
         }
      },
		parse: function(response, options){
		   if(!this.get('initialized')){
		      this.get('list').on("notification:read", this.decrCount, this);
		   }
		   
		   this.set({initialized: true});
		   var r = Backbone.Model.prototype.parse(response, options);
         
         r.next_page = parseInt(r.next_page) 
         
         if(!isNaN(r.next_page) && this.get('page') < r.next_page){
            this.set({next_page: r.next_page}); 
         }else{
            this.trigger('notification:end');
         }
         

         
         this.get('list').add(r.result, {merge: true});
         this.updateTotalUnread(r.unread_count);
		},
   
   })
   
   return NotiCollection;
});
