define([
   'backbone',
   'marionette',
   'underscore',
   'vent',
   'reqres',
   "text!auth/tpl-login-page.html",
   'auth/AuthForms'
   
],
function (Backbone, Marionette,_, vent, reqres,LoginTpl, Forms) {
   "use strict";
   
   
   var LoginPageView = Marionette.ItemView.extend({
      template: LoginTpl,
      
      initialize: function(){
         
      },
      ui:{
         loginForm   : '#login-form', 
         passwordForm: '#input-password',
         FBLoginBtn  : '#fb-login-btn',
         loginBtn    : '#login-btn'
      },
      onRender: function(){
   
         this.form = Forms.LoginForm.render();
         this.ui.loginForm.append(this.form.el);
         
         var that = this;
         setTimeout(function(){
            that.form.focus();
         }, 1);
      },
      
      events:{
         'click @ui.loginBtn'    : 'onLoginAttempt',
         'click @ui.FBLoginBtn'  : 'onFBLoginAttempt', 
         'click #forgot-password-link': 'onForgotPassword', 
         'keyup'						:	'onKeyUp',
         'click .signup-link'    : 'onSignupClick'
      
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault(); 
             
         if(k == ENTER_KEY){
            this.onLoginAttempt();
         }
         
      },
      onLoginAttempt: function(evt){
         var errors = this.form.validate();
         this.form.on('login:change password:change', function(form, editor) { 
              form.fields[editor.key].validate(); 
         });
         if(errors) return;
         
         this.ui.loginBtn.button('loading');
         var that = this;
         vent.trigger('auth:loginAttempt', {
            login: this.form.getValue('login'),
            password: this.form.getValue('password')
         }, function(){
            that.ui.loginBtn.button('reset');
         });
         
      },
      onFBLoginAttempt: function(){;
         this.ui.FBLoginBtn.button('loading');
         var FB = reqres.request('FB');
         var that = this;
         FB.login(function(r) {
            if(r.status === 'connected'){
               //get user info
               FB.api('/me', function(data){
                  vent.trigger('auth:FBLoginAttempt', data, function(){
             
                     that.ui.FBLoginBtn.button('reset');
  
                  });
               });
               
            }
         }, {scope: 'public_profile,email,user_friends, user_groups'});
      
      },
      onForgotPassword: function(){
         vent.trigger('navigate:forgotPassword')
      },
      onSignupClick: function(){
         vent.trigger('navigate:signup');
      }

    });
    
    return LoginPageView;
});
