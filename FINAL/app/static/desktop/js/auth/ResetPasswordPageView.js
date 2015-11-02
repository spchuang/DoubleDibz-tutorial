define([
   'marionette',
   'vent',
   'reqres',
   "text!auth/tpl-reset-password-page.html",
   'auth/AuthForms'
   
],
function (Marionette, vent, reqres, ResetPasswordTpl, Forms) {
   "use strict";
   

   
   var ResetPasswordPageView = Marionette.ItemView.extend({
      template: ResetPasswordTpl,
      
      initialize: function(options){
         options = options || {fromVerifyEmail: true};
         this.user = reqres.request("currentUser");
         
         // we can use this from either accoutn reset or verify email page
         this.fromVerifyEmail = options.fromVerifyEmail;
         console.log(this.fromVerifyEmail);
      },
      ui:{
         passwordForm: '#password-form',
         changeBtn   : '#change-btn'
      },
      onRender: function(){
         if(this.user.get('fb_only') === 'true'){ 
           
            this.form = Forms.NewPasswordForm.render();
         }else{
            this.form = Forms.ResetPasswordForm.render();
         }
         
         this.ui.passwordForm.append(this.form.el);
         vent.trigger("close:modal");
      },
      events:{
         'click @ui.changeBtn' :  'onResetPasswordAttempt',
         'keyup'			     :  'onKeyUp'
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault(); 
             
         if(k == ENTER_KEY){
            this.onResetPasswordAttempt();
         }
      },
      onResetPasswordAttempt: function(){
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors) return;
         
         var that = this;
         
         //that.form.setValue({password:'', old_password:'', confirm: ''});
         this.ui.changeBtn.button('loading');
         if(this.fromVerifyEmail){
            
            reqres.request('session').verifyEmail(Backbone.history.location.search, this.form.getValue(), {
               success: function(res){
                  vent.trigger("navigate:login");
                  vent.trigger("flash:alert", {type: 'success', msg: res});
               },error: function(res){
                  vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
                  that.ui.changeBtn.button('reset');
               }
            });   
         }else{
            reqres.request('session').updatePassword(this.form.getValue(),{
               success: function(res){
                  vent.trigger("close:modal");
                  vent.trigger("global:flash:alert", {type: 'success', msg: res});
                  
                  //if we just set up our first password, pull new info
                  if(that.user.get('fb_only') === 'true'){
                     that.user.set({fb_only: 'false'});
                  }
               },error: function(res){
                  vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
                  that.ui.changeBtn.button('reset');
               }
            }); 

         }
      }
    });
    
    return ResetPasswordPageView;
});
