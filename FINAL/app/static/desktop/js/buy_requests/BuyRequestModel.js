define([
   "reqres",
], function(reqres){
   'use strict';
       
   var BuyRequestModel  = Backbone.Model.extend({

		urlRoot: function(){
         return reqres.request('api').buy_requests; 
      },
      initialize: function(options) {


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
		is_active: function(){
   		return this.get('status') == 'active';
		},
		is_fb: function(){
   		return this.get('src') === 'fb';
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
            'is_owner': this.is_owner()
         });
		}
   });
   
   var BuyRequestCollection = Backbone.Collection.extend({
      model : BuyRequestModel,
      
      url: function(){
         return reqres.request('api').buy_requests; 
      }
      
   });
       
   return {
      model: BuyRequestModel,
      collection: BuyRequestCollection
   };
});
