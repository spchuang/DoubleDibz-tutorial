define([
   "reqres",
], function(reqres){
   'use strict';
   
   var getBookmarkUrl = function(post){
      var typeText;
      if(post.is_fb()){
         typeText = '/fb/';
      }else{
         typeText = '/us/';
      }
      return reqres.request('api').bookmarks + typeText + post.id
   }
   
   var UserPostModel = Backbone.Model.extend({
      urlRoot: function(){
         return reqres.request('api').search+'/'+this.user_name;
      },
      initialize: function(options){
         this.user_name = options.user_name;
      }
   });
   
   var PostModel  = Backbone.Model.extend({
      modalMode: false,
		urlRoot: function(){
         return reqres.request('api').posts; 
      },
      initialize: function(options) {
      
         if(!this.is_fb() && !_.isUndefined(options)){
            this.put_primary_in_front(options);
         }
         
		},
		put_primary_in_front: function(options){
   		//sort the images (put the primar picture in front)
         //there are probably better ways to handle this...
         var primary = _.find(options.images, function(i){
            return i.is_primary == 1;
         });
         var rest = _.filter(options.images, function(i){
            return i.is_primary == 0;
         });
         rest.unshift(primary);
         this.set({images: rest});
		},
		imgSelected: null,
		selectPrevImage: function(){
   		var i = this.imgSelected - 1;
   		if(i < 0){
      		i = this.getImagesLength()-1;
   		}
   		this.selectImage(i);
		},
		getImagesLength: function(){
   		return this.get("images").length;
		},
		selectNextImage: function(){
   		var i = this.imgSelected + 1;
   		if(i >= this.getImagesLength()){
      		i = 0;
   		}
   		this.selectImage(i);
		},
		selectImage:function(id){
   		//check if image actualy exists
   		if(!this.has('images') || !(id in this.get('images'))){
            return false;
   		}
   		
   		this.imgSelected = parseInt(id);
   		this.trigger('change:imgSelected');
		},
		getSelectedImageSrc: function(getThumbnail){
		   getThumbnail = getThumbnail || false;
		   if(!getThumbnail){
   		   return this.get('images')[this.imgSelected].link;
		   }else{
   		   if(this.is_fb()){
      		   return this.get('images')[this.imgSelected].link;
   		   }else{
      		   return this.get('images')[this.imgSelected].thumbnail;
   		   }
		   }
		},
		//active:0, pending:1, inactive:2
		toggleStatus: function(callback){
         var data = {};
   		if(this.get('status') == 'active'){
      		data.status_code = 2
   		}else if(this.get('status') == 'inactive'){
      		data.status_code = 0;
   		}
   		   
   		return this.save(data,{
      		patch: true,
      		wait: true,
      		url: this.urlRoot()+'/'+this.id+'/status'});
		},
		/*
		toggleSubscribe: function(callback){
		   var status_code;
   		if(this.get('has_subscribed')){
      		status_code = INACTIVE;
   		}else{
      		status_code = ACTIVE;
   		}
   		this.set({has_subscribed: status_code === ACTIVE });
   		
         var opts = { url: reqres.request('api').posts+"/"+this.id+"/subscribe", method: 'PUT'};
         var that = this;
         return this.ajax({status_code: status_code}, opts, callback).fail(function(res){
            //if we fail, toggle back
            that.set({has_subscribed: (1-status_code)===ACTIVE });
         });   
		},
		*/
		getBookmarkStatus: function(){
   		var s = this.get('is_bookmarked');
   		if(_.isBoolean(s)){
      		return s;
   		}else{
   		   // get status 
   		   var opts = {
   		      url: getBookmarkUrl(this), 
   		      method: 'GET'
   		    };
   		   var that = this;
            this.ajax(null, opts).done(function(res){
               that.set({is_bookmarked: res.data.has_bookmarked});
            });  
            return null; 	
   		}
		},
		bookmark: function(callback){
   		if(!this.get('is_bookmarked')){
   		   this.set({is_bookmarked: true});
   		   
   		   var opts = { 
   		      url: getBookmarkUrl(this),
   		      method: 'POST'
   		   };
            var that = this;
            return this.ajax(null, opts).fail(function(res){
               //if we fail, set back
               that.set({is_bookmarked: false});
            }); 
   		}
		},
		unbookmark: function(callback){
         if(this.get('is_bookmarked')){
   		   this.set({is_bookmarked: false});
   		   
   		   var opts = { 
   		      url: getBookmarkUrl(this),
   		      method: 'DELETE'
   		   };
   		   
            var that = this;
            return this.ajax(null, opts).fail(function(res){
               //if we fail, set back
               that.set({is_bookmarked: true});
            }); 
   		}
		},
		is_active: function(){
		   if(this.is_fb()){
   		   return true;
		   }
   		return this.get('status') == 'active';
		},
		
		is_fb: function(){
   		return this.get('src') == 'fb';
		},
		is_owner: function(){
		   if(this.is_fb()){
   		   return false;
		   }
		   if(!this.get('user')){
   		   return false;
		   }
   		return this.get('user').user_name === reqres.request('currentUser').get('user_name');
		},
		toJSON: function(){
   		return _.extend({}, this.attributes, {
            'is_selling' : this.is_active(),
            'modalMode': this.modalMode,
            'is_owner': this.is_owner()
         });
		}
   });
   
   var PostCollection = Backbone.Collection.extend({
      model : PostModel,
      initialize: function(){ 
         this.setElement(this.at(0)); 
         this.strategy === 'sellingFirst';
      },
      url: function(){
         return reqres.request('api').posts; 
      },
      byStatus: function(status){
         var filtered = this.filter(function(post){
            return post.get("status") === status;
         });
         return new PostCollection(filtered);
      },
      getElement: function() {
         return this.currentElement;
      },
      setElement: function(model){
         this.currentElement = model;
      },
      next: function (){
         var newIndex = this.indexOf(this.getElement()) + 1;
         if(newIndex >= this.length){
            newIndex = 0;
         }
         return this.at(newIndex);
      },
      prev: function() {
         var newIndex = this.indexOf(this.getElement()) - 1;
         if(newIndex < 0){
            newIndex = this.length-1;
         }
         return this.at(newIndex);
      }
   });   
   
   var SubscribedPosts  = Backbone.Model.extend({
      initialize: function(options) {

		},
		getPosts: function(callback){
         var opts = {url: reqres.request('api').posts+'/subscribe' , method: 'GET'};
         this.ajax(null, opts , callback);   		
		}
   });

   var BookmarkedPosts  = Backbone.Model.extend({
		getPosts: function(){
         var opts = {
            url: reqres.request('api').bookmarks , 
            method: 'GET'
         };
         return this.ajax(null, opts);   		
		}
   });

   return {
      model: PostModel,
      UserPostModel: UserPostModel,
      subscribe: SubscribedPosts,
      bookmark: BookmarkedPosts,
      collection: PostCollection
   };
});
