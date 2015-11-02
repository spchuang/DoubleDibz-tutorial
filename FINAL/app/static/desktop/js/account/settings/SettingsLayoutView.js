define([
   'marionette',
   'app',
   'vent',
   'reqres',
   "account/settings/EmailCollection",
   "account/settings/CircleCollection",
   "account/settings/PasswordView",
   "account/settings/ProfileView",
   "account/settings/FBAccountView",
   "account/settings/EmailsView",
   "account/settings/GroupsView",
   "text!account/settings/tpl-settings-layout.html",
],
function (Marionette, App, vent, reqres, EmailCollection, CircleCollection, PasswordView,
   ProfileView, FBAccountView, EmailsView, GroupsView, LayoutTpl) {
   "use strict";
   
   var LayoutPageView = Marionette.LayoutView.extend({
      template: LayoutTpl,
      
      regions:{
         profileRegion:    ".profile-region",
         emailRegion:      ".email-region",
         passwordRegion:	".password-region",
         FBAccountRegion: ".fb-account-region",
         groupRegion:     ".group-region",
      },
      initialize: function(){
         
         
      },
      onShow:function(){
         //this.showProfile();
         this.showEmail();
      },
      onRender: function(){
         this.showPassword();
         this.showFBAccount();
         this.showGroup();
         this.$(".tooltip-helper").tooltip({
            placement: 'bottom',
            html: true,
            container: 'body'
         })
      },
      showProfile: function(){
         var that = this;
         var promise = reqres.request('session').getSettings();
         
         vent.trigger('region:deferredShow', that.profileRegion, promise, {
            success: function(res){
               that.profileRegion.show(new ProfileView({model: reqres.request('currentUser')}));
            },error: function(res){
                vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      
      showPassword: function(){
         this.passwordRegion.show(new PasswordView());
      },
      showFBAccount: function(){
         this.FBAccountRegion.show(new FBAccountView()); 
      },
      showEmail: function(){
         var emails = new EmailCollection();
         var that = this;
         
         vent.trigger('region:deferredShow',that.emailRegion, emails.fetch(), {
            success: function(res){
               that.emailRegion.show(new EmailsView({collection: emails}));
            },error: function(res){
                vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
           
      },
      showGroup: function(){
         var my_groups = reqres.request('session').getCurrentUser().get('circles');
         var groups = new CircleCollection(my_groups);
         this.groupRegion.show(new GroupsView({collection: groups}));  
   
      },
   });
   return LayoutPageView;
});
