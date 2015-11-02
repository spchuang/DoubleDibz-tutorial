define([
   'reqres'
], function(reqres){
   'use strict';
   var CommentModel  = Backbone.Model.extend({
      initialize: function() {
         
		}
   });
   
   var CommentCollection = Backbone.Collection.extend({
      model : CommentModel,
      initialize: function(models, options){
         this.post_id = options.post_id;
      },
      url: function(){
         return reqres.request('api').posts+'/'+this.post_id+'/comments'; 
      }
   });
       
   return CommentCollection;
});
