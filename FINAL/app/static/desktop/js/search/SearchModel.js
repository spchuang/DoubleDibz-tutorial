define([
   "underscore",
   "reqres",
], function(_, reqres){
   'use strict';
   
   var ORDER_TYPE = ['date-desc', 'price-asc', 'price-desc'];
   var FROM_TYPE = ['all', 'today', 'this-week', 'this-month'];
   var POST_TYPE = ["sell", "buy"];
   var SOURCE_TYPE = ["all", "fb", "us"];
   var DEFAULT = {
      'hashtag': null,
      'name':     null,
      'page':   1,
      'order': 'date-desc',
      'from': 'all',
      'user_name': null,
      'status': 0,
      'type': "sell",
      'src' : 'all'
   };
   
   var SearchModel = Backbone.Model.extend({
      filterArgs: function(urlArgs){
         // fall back to default values
         var args = _.object(_.map(DEFAULT, function(value, field){
            if(field in urlArgs){
               return [field, urlArgs[field]];
            }
            return [field, DEFAULT[field]];
         }));
         
         // filter invalid order
         if(_.indexOf(ORDER_TYPE, args['order']) == -1){
            args['order'] = DEFAULT['order'];
         }
         
         
         // filter invalid from
         if(_.indexOf(FROM_TYPE, args['from']) == -1) {
            args['from'] = DEFAULT['from'];
         }
         
         // filter invalid post type
         if(_.indexOf(POST_TYPE, args['type']) == -1) {
            args['type'] = DEFAULT['type'];
         }    
         
         // filter invalid source type
         if(_.indexOf(SOURCE_TYPE, args['src']) == -1) {
            args['src'] = DEFAULT['src'];
         }       
         
         // filter invalid page number
         args['page'] = parseInt(args['page']);
         if(_.isNaN(args['page'])){
            args['page'] = DEFAULT['page']
         }
         
         // if type is buy, set order to default (since price order doesn't matter for buy request)
         if(args['type'] === 'buy') {
            args['order'] = DEFAULT['order'];
         }
         
         return args;
      },
      initialize: function(circle, args){
         this.args = this.filterArgs(args);
         this.circle = circle;
         this.isLoading = false;
      },
      createHistoryUrl: function(){
         // TODO: hide param if it is default value
         return _.compact(_.map(this.args, function(value,field){
            if(!_.isNull(value) && DEFAULT[field]!=value){
               return field+"="+value;
            }
         }));
      },
      url: function(){
         var h = this.createHistoryUrl();
         h.push("circle="+this.circle);
         return reqres.request('api').search + "?" + h.join("&");
      },
      getPosts: function(callback){ 
         var opts = {url: this.url(), method: 'GET'};
         this.isLoading = true;
         var that = this;
         return this.ajax(null, opts, callback).always(function(){
            that.isLoading = false;
         });
      },
      updateArgs: function(key, value) {
         if(key === "order" && _.indexOf(ORDER_TYPE, value) > -1) {
            this.args.order = value;
         }
         if(key === "from" && _.indexOf(FROM_TYPE, value) > -1) {
            this.args.from = value;
         }
         if(key === "type" && _.indexOf(POST_TYPE, value) > -1) {
            this.args.type = value;
         }
         if(key === "src" && _.indexOf(SOURCE_TYPE, value) > -1) {
            this.args.src = value;
         }
         
      },
      toJSON: function(){
         /*var q = ''
         //either hashtag or name search
         if(_.has(this.args, "hashtag")){
            q = "#"+this.params.hashtag;
         }else if(_.has(this.params, "name")){
            q = this.params.name;
         }*/
         return {circle: this.circle.toUpperCase() , q: ''};
      },
      loadNextPage: function(){
         this.args.page += 1;
         return this.getPosts();
      }
   });

   return SearchModel;
});
