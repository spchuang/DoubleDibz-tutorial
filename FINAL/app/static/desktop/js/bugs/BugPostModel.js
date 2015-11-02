define([
   "reqres",
], function(reqres){
   'use strict';
      
       
   var BugPostModel  = Backbone.Model.extend({
		initialize: function () {
		
		},
		url: function(){
   		return reqres.request('api').bugposts; 
		}
   });
       
   return BugPostModel;
});
