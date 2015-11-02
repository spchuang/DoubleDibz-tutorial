define([
   'backbone',
   'marionette',
   'vent',
   'reqres',
   'posts/PostModel',
   'posts/user/UserPostPageView',
   'account/settings/SettingsLayoutView',
   "account/AccountLayoutView",
   "account/BookmarkView",
   "account/HelpView",
   "account/VerifyEmailModalView"
],
function (Backbone, Marionette, vent, reqres, PostCollection, UserPostPageView, 
      SettingsLayoutView, AccountLayoutView, BookmarkView, HelpView, VerifyEmailModalView) {
   "use strict";
   
   /*
      Handles events related to account settings/...
   */
   
   var AccountController = Marionette.Controller.extend({
      initialize: function(options){
         this.layout = null;
      },
      initializeSettingLayout: function(){
         if(!this.layout || this.layout.isDestroyed){
            this.layout = new AccountLayoutView();
            vent.trigger('mainRegion:show', this.layout);
         }
      },
      showMyPostsPage: function(){
         this.initializeSettingLayout();  
         //TODO: branch it out in the future
         this.layout.mainRegion.show(new UserPostPageView({
            user: reqres.request("currentUser"), 
            hideHeader: true,
            is_owner: true
         }));
         vent.trigger("account:selected", "posts");
      },
      showMyBookmarksPage: function(){
         this.initializeSettingLayout();  

         vent.trigger("account:selected", "bookmarks");
         var that = this;
         var promise = (new PostCollection.bookmark()).getPosts();
         
         vent.trigger("region:deferredShow", this.layout.mainRegion, promise, {
            success: function(res){
               that.layout.mainRegion.show(new BookmarkView({
                  collection: new PostCollection.collection(res.data)
               }));
            }
         });
      },
      showSettingsPage: function(){ 
         this.initializeSettingLayout();  
         this.layout.mainRegion.show(new SettingsLayoutView());
         vent.trigger("account:selected", "settings");
      },
      
      showHelpPage: function(){
         vent.trigger('domChange:title', reqres.request('page:name').help);
         this.initializeSettingLayout();  
         this.layout.mainRegion.show(new HelpView());
         vent.trigger("account:selected", "help");
      },
      saveSettingsAttempt: function(data){
         reqres.request('session').updateSettings(data,{
            success: function(res){
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         }); 
      },
      
      updateFBLinkAttempt: function(callback){
         reqres.request('session').updateFBLink({
            success: function(res){
               vent.trigger("flash:alert", {type: 'success', msg: res});
               
               if(callback && 'success' in callback) callback.success();
               
            },error: function(res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            },
            complete: function(){
               if(callback && 'complete' in callback) callback.complete();
            }
         }); 
      }      
   });
   var ac = new AccountController();
   
   
   var loginRequiredPages = [
      'showMyPostsPage',
      'showMyBookmarksPage',
      'showSettingsPage',
      'showHelpPage'
   ];


   reqres.request('session').setLoginRequired(ac, loginRequiredPages);
   

   vent.on("account:saveSettingsAttempt", function(data){
      ac.saveSettingsAttempt(data);
   });

   vent.on("show:addVerifyEmail:modal", function(){
      vent.trigger('open:modal', new VerifyEmailModalView(), {
         dialogClass: 'verify-email-modal',
         animate: false
      });
   });
   
   vent.on("account:updateFBLinkAttempt", function(callback){
      ac.updateFBLinkAttempt(callback);      
   });

   vent.on("navigate:account:settings", function(){
      ac.showSettingsPage();
      Backbone.history.navigate('/my/settings');
   });
   
   vent.on("navigate:account:help", function(){
      ac.showHelpPage();
      Backbone.history.navigate('/help');
   });
   
   vent.on("navigate:account:bookmarks", function(){
      ac.showMyBookmarksPage();
      Backbone.history.navigate('/my/bookmarks');
   });
   
   vent.on("navigate:account:posts", function(){
      ac.showMyPostsPage();
      Backbone.history.navigate('/my/posts');
   });


   return ac;
});


