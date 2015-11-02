define([
   'underscore',
   'reqres'
], function(_, reqres){
   'use strict';
   var CategoryModel  = Backbone.Model.extend({
      /*defaults: {
			name: '',
			subcategories: {
			}
		},*/
      initialize: function() {
         
		},
		toString: function(){
   		return this.get('name');
		},
		toJSON: function(){
		   var show = this.attributes.name.replace(/_/g, ' ').
		                                   replace('and', '&');
   		return _.extend({}, this.attributes, {
   		   showName: show
   		});
		}
   });
   
   var CategoryCollection = Backbone.Collection.extend({
      model : CategoryModel,
      url: function(){
         return reqres.request('api').categories; 
      },
      comparator: function(model){
         return  model.get('name');
      },
      parse: function (response, options) {
         var that = this;
         _.each(response.data, function(c){
            that.add({name: c.toUpperCase()})
         });
      },
      toOptions: function(){
         var options = _.map(this.models, function(model){
            return {
               val: model.get('name'),
               label: model.get('name')
            }
         });
         return options;
      },
      getCategory: function(hashtags){
         hashtags = _.map(hashtags, function(h){ return h.name});

         //return the first category matching the hashtags
         var c = _.find(this.toJSON(), function(category){
            return _.contains(hashtags, category.name);
         })
         return c.name;
      }
   });
       
   return CategoryCollection;
});
