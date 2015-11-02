define([
   "reqres",
], function(reqres){

   'use strict';
       
   var EmailModel  = Backbone.Model.extend({
		initialize: function () {
		
		},
		is_primary: function(){
   		return this.get('is_primary') == 1;
		},
		is_verified: function(){
         return this.get('status')=='verified';
		},
		toggle_primary: function(){
		   //toggle between 0 and 1
   		return this.set('is_primary', 1-this.get('is_primary'));
		},
		sync: function(method, model, options) {
		   //overwrite default delete method to use 'POST' and carry data
         if (method === "delete"){
            method = "create";    
            options.data = JSON.stringify(options.data);
            options.url  = this.collection.url() + '/' + this.id + reqres.request('api').delete_email;
            options.contentType = 'application/json';
         } 
         return Backbone.sync(method, model, options);
      },
      set_primary: function(options){
         options.url = this.collection.url() + '/' + this.id + reqres.request('api').update_email;
         this.save({}, options);
      },
      resend_verification: function(callback){
         var opts = { url: reqres.request('api').emails+'/'+this.id + reqres.request('api').resend_verify, method: 'GET'};
         this.ajax(null, opts , callback);
      }
   });
   
   var EmailCollection = Backbone.Collection.extend({
      model : EmailModel,
      url: function(){
         return reqres.request('api').emails; 
      },

   });
       
   return EmailCollection;
});
