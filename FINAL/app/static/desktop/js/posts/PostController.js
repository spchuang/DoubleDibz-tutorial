define([
   'backbone',
   'marionette',
   'vent',
   'reqres',
   'posts/PostModel',
   'posts/user/UserModel',
   "posts/edit/PostCreatePageView",
   "posts/user/UserPostPageView",
   "posts/item/PostItemPageView",
   "posts/edit/PostEditPageView",
   'posts/owner/ItemOwnerView',
],
function (Backbone, Marionette, vent, reqres, PostCollection, UserModel,
                  PostCreatePageView, UserPostPageView, PostItemPageView, PostEditPageView, ItemOwnerView) {
   "use strict";
   
   var PostController = Marionette.Controller.extend({

      showMyPostPage: function(){
        vent.trigger("mainRegion:show", new UserPostPageView({user: reqres.request("currentUser")}));
      },
      showUserPostPage: function(user_name){ 
         /*
            Show user profile page
         */
         if(user_name == reqres.request("currentUser").get("user_name")){
            return this.showMyPostPage();
         }
         var user = new UserModel({user_name: user_name});
         var promise = user.fetch();
         vent.trigger("mainRegion:deferredShow", promise, {
            success: function(res){
               // This user exists!
               vent.trigger("mainRegion:show", new UserPostPageView({user: user}));
            }
         });
         
      },
      //Directly show the post page with the given model
      showItemPostPageModel: function(model){
         vent.trigger('domChange:title', reqres.request('page:name').viewItem);
         vent.trigger('mainRegion:show', new PostItemPageView({
            model: model
         }));
      },
      showCreatePostPage: function(){
         vent.trigger('domChange:title', reqres.request('page:name').create);
         var page = new PostCreatePageView({
            categories: reqres.request('categories'),
            model: new PostCollection.model()
         });
         vent.trigger('mainRegion:show', page);
      },
      showOwnerItemPage: function(model, tab){
         this.ownerPageView = new ItemOwnerView({
            model: model,
            tab: tab
         });
         // this will display the owner page
         vent.trigger('mainRegion:show', this.ownerPageView);
      },
      showItemPostPage: function(id){   
         vent.trigger('domChange:title', reqres.request('page:name').viewItem); 

         /*
            This page should be able to be seen by anyone. 
         */
         var model = new PostCollection.model({id:id});
         var promise = model.fetch();
         var that = this;
         vent.trigger("mainRegion:deferredShow", promise, {
            success: function(res){
               // if is owner, show owner page
               if(model.is_owner()){
                  that.showOwnerItemPage(model, 'view');
               }else{
                  vent.trigger('mainRegion:show', new PostItemPageView({
                     model: model
                  }));
               }
            }
         });
      },   
      showEditPostPage: function(id){
         vent.trigger('domChange:title', reqres.request('page:name').editItem);

         /*
            This page should only be allowed for post owners
         */
         var model = new PostCollection.model({id:id});
         var that  = this;
         
         var promise = model.fetch();
         vent.trigger("mainRegion:deferredShow", promise, {
            success: function(res){
               if(model.is_owner()){
                  that.showOwnerItemPage(model, 'edit');
               }else{
                  vent.trigger('navigate:404Page');
               };
            }
         });
      },  
      showPostChatsPage: function(id){
         vent.trigger('domChange:title', reqres.request('page:name').editItem);

         /*
            This page should only be allowed for post owners
         */
         var model = new PostCollection.model({id:id});
         var that  = this;

         var promise = model.fetch();
         vent.trigger("mainRegion:deferredShow", promise, {
            success: function(res){
               if(model.is_owner()){
                  that.showOwnerItemPage(model, 'chats');
               }else{
                  vent.trigger('navigate:404Page');
               };
            }
         });
      },
      
      deleteAttempt: function(post, callback){
         var r = confirm("Are you sure you want to delete this?");
         if (r == false) return;
         post.destroy({
            wait: true,
            success: function(model, res){
               vent.trigger("navigate:account:posts");
               if(callback) callback();
               vent.trigger("flash:alert", {type: 'success', msg: res});
               
            },error: function(model, res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      bookmarkAttempt: function(post, callback){
         if(!reqres.request('isLoggedIn')){
            return vent.trigger('navigate:login');
         }
      
         var promise;
         if(!post.get('is_bookmarked')){
            promise = post.bookmark();             
         }else{
            promise = post.unbookmark();                
         }
         promise.done(function(res){
            if(callback) callback(res);
         }).fail(function(res){
            vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
         });   
      }
   });
   
   var pc = new PostController();
   
   var loginRequiredPages = [
      'showCreatePostPage',
      'showMyPostPage',
      'showEditPostPage',
      'showPostChatsPage',
      'deleteAttempt',
   ];
   
   reqres.request('session').setLoginRequired(pc, loginRequiredPages);
   
   pc.listenTo(vent, 'posts:deleteAttempt', function(post, callback){
      pc.deleteAttempt(post, callback);
   });
 
   pc.listenTo(vent,"navigate:posts:user", function(user_name){
      pc.showUserPostPage(user_name);
      Backbone.history.navigate('/u/'+user_name);
   });
   
   pc.listenTo(vent,"navigate:posts:edit", function(id){
      pc.showEditPostPage(id);
      Backbone.history.navigate('posts/'+id+'/edit');
   });
   
   pc.listenTo(vent,"navigate:createPost", function(){
      pc.showCreatePostPage();
      Backbone.history.navigate('posts/create');
   });
   
   pc.listenTo(vent, 'navigate:posts:item:model', function(model){
      pc.showItemPostPageModel(model);
      Backbone.history.navigate('posts/'+model.get('id'));
   });
   
   pc.listenTo(vent, "navigate:posts:item", function(id){
      pc.showItemPostPage(id);
      
      Backbone.history.navigate('/posts/'+id);
      
   });
   pc.listenTo(vent, "posts:bookmarkAttempt", function(post, callback){
      pc.bookmarkAttempt(post, callback);
   });
  
   pc.listenTo(vent, "posts:fb:share", function(post_id){
      //vent.trigger("flash:alert", {type: 'info', msg: "Facebook sharing is coming soon!"},{timer: true});
         
      //hard code the url here..
      
      var url = 'http://www.facebook.com/sharer.php?u=http://www.DoubleDibz.com/posts/'+post_id;
      window.open(url, "Facebook", "width=675,height=376,resizable=0");
      
      // TODO CHANGE THIS
      // 267375200006835
      /*var url = reqres.request('domain')+'/posts/'+this.model.id;
      FB.ui({
        method: 'send',
        to: '267375200006835',
        display: 'iframe',
        link: url,
      });*/

   })

   return pc;
});


