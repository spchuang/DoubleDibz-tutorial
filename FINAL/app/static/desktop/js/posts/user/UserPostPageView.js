define([
   'marionette',
   'vent',
   "reqres",
   'posts/PostModel',
   'buy_requests/BuyRequestModel',
   'search/SearchModel',
   'posts/templates/PostListView',
   'buy_requests/templates/BuyRequestListView',
   'text!posts/user/tpl-user-page-layout.html'
],
function (Marionette, vent, reqres, Post, BuyRequest, SearchModel, PostlistView, BuyRequestListView, TplUserPostPage) {
   "use strict";
   
   var UserPostPageView = Marionette.LayoutView.extend({
      template: TplUserPostPage,
      serializeData : function(){
         return{
            user: this.user.toJSON()
         };
      },
      regions:{
         postWrapRegion: ".post-wrap"
      },
      events:{
         'click @ui.postTabs': 'onTabClick',
         'click @ui.editProfileLink': function(){
            vent.trigger('navigate:account:settings');
         }
      },
      ui:{
         postTabs: '.post-tabs',
         numPosts: '.num-posts',
         editProfileLink: '.edit-profile-link'
      },
      initialize: function(options){
         options = options || {}
         this.user = options.user;
         this.is_owner = options.is_owner || false;
         // default tab is selling
         this.tab = options.tab || "sell";
         this.posts = new Post.collection();
         this.buy_requests = new BuyRequest.collection();
         this.setCollection();
         this.hideHeader = options.hideHeader || false;
      },
      onRender: function(){
         // HACK: doing this since we're showing the page on account page too
         if(this.hideHeader){
            this.$(".user-page-header").addClass('hide');
         }else{
            if(this.user.id !== reqres.request('currentUser').id){
               this.ui.editProfileLink.remove();
            }
         }
      },
      updateData: function(){ 
         var promise = new SearchModel('ucla', {type: this.tab, user_name: this.user.get('user_name'), status: 'all'}).getPosts();
         var that = this;
         vent.trigger('region:deferredShow', this.postWrapRegion, promise, {
            success: function(res){
               // sort by post status
               res.data.result = _.sortBy(res.data.result, function(post){
                  return post.status;
               });
               that.collection.reset(res.data.result);
               that.updateView();
            },error: function(res){
                vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
     },
     onTabClick: function(evt) {
         var target = $(evt.target);
         if(target.hasClass('active')){
            return;
         }
         this.tab = target.data('tab-type');
         this.setCollection();
         this.updateData();
         this.ui.postTabs.removeClass('active');
         target.addClass('active');
     },
     updateView: function(posts){
         if(this.tab === "sell"){
            this.postWrapRegion.show(new PostlistView({collection: this.collection, hideHeader: this.hideHeader, is_owner: this.is_owner}));
         }else{
            this.postWrapRegion.show(new BuyRequestListView({collection: this.collection, is_owner: this.is_owner}));
         }
         this.ui.numPosts.text(this.collection.length);
     },
     onShow: function(){
         this.updateData();
         this.$("[data-tab-type="+this.tab+"]").addClass("active");
     },
     setCollection: function(){
        if(this.tab === "sell"){
           this.collection = this.posts;
        }else{
           this.collection = this.buy_requests;
        }
     }   
   });
   
   return UserPostPageView;
});
