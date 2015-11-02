define([
   'marionette',
   'app',
   'vent',
   'reqres',
   "general/FlashMessageView",
   'auth/ResetPasswordPageView',
   'auth/AuthForms'
],
function (Marionette, App, vent, reqres, FlashMessageView, ResetPasswordPageView, Forms) {
   "use strict";
   
   
   var PasswordView = Marionette.ItemView.extend({
      template: '<span class="password-edit btn btn-primary"></span>',
      
      events:{
         'click @ui.passwordEdit'   :   'onPasswordClick',
      },
      ui:{
         passwordEdit: '.password-edit',
      },
      initialize: function(){
        this.user = reqres.request('currentUser'); 
        this.listenTo(this.user, 'change:fb_only', this.renderPassword);
      },
      onRender: function(){
         this.renderPassword();
      },
      renderPassword: function(){
         if(this.user.get('fb_only') === 'true'){ 
            this.ui.passwordEdit.text("Setup Password");
         }else{
            this.ui.passwordEdit.text("Change Your Password");
         }
      },
      onPasswordClick: function(){   
         var options = {
            dialogClass: 'auth-dialog',
            onShow: function(modal){
               setTimeout(function(){
                  modal.options.content.form.focus();
               }, 1); 
            }
         };
         vent.trigger('open:modal', new ResetPasswordPageView({fromVerifyEmail: false}), options);   
      }
   });
   return PasswordView;
});
