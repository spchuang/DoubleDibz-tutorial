define([
   "reqres",
], function(reqres){

   'use strict';
       
   var CircleModel = Backbone.Model.extend({
		initialize: function (){
		
		},
		joinCircle: function(callback){

		},
		leaveCircle: function(callback){
		
		}
		
   });
   
   var CircleCollection = Backbone.Collection.extend({
      model : CircleModel,
      initialize: function(){

      },
      url: function(){
         return reqres.request('api').circles; 
      }

   });
       
   return CircleCollection;
});
