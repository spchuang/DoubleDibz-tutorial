define([
   "reqres",
], function(reqres){
   'use strict';
      
   
   var UserModel = Backbone.Model.extend({
      urlRoot: function(){
         return reqres.request('api').user+'/'+this.user_name;
      },
      initialize: function(options){
         this.user_name = options.user_name;
      }
   });
   
   return UserModel;
});
