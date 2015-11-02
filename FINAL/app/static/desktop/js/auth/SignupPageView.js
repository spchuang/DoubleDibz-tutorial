define([
   'backbone',
   'jquery',
   'underscore',
   'marionette',
   'vent',
   'reqres',
   "text!auth/tpl-signup-page.html",
   'auth/AuthForms'
],
function (Backbone, $, _, Marionette, vent, reqres, SignupTpl, Forms) {
   "use strict";
   
   var SignupPageView = Marionette.ItemView.extend({
      template: SignupTpl,
      
      events:{
         'click @ui.signupBtn'    : 'onSignupAttempt',
         'click @ui.FBSignupBtn'  : 'onFBSignupAttempt',
         'keyup'				       :	'onKeyUp',
         'click @ui.usingEmailBtn': 'onUsingEmailClick',
         'click .go-login-link'      : 'onLoginClick'
      
      },
      ui:{
         signupForm     : '#signup-form',
         signupBtn      : '#signup-btn',
         FBSignupBtn    : '#fb-signup-btn',
         usingEmailBtn  : '.signup-using-email'
      },
      onRender: function(){
         this.form = Forms.SignupForm.render();
         
         //hide basic signup form
         //this.ui.signupForm.hide();
         //this.ui.signupBtn.hide();
         
         //temp
         this.ui.usingEmailBtn.hide();
         
         this.ui.signupForm.append(this.form.el);
         
         var that = this;
         setTimeout(function(){
            that.form.focus();
         }, 1); 
         
         
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault();    
         if(k == ENTER_KEY){
            this.onSignupAttempt();
         }
      },
      onSignupAttempt: function(){
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors) return;
         
         var data = this.form.getValue();
         this.ui.signupBtn.button('loading');
         var that = this;
         vent.trigger('auth:signupAttempt', data, function(){
            that.ui.signupBtn.button('reset');
         });
      },
      
      onFBSignupAttempt: function(){
         var that = this;
         this.ui.FBSignupBtn.button('loading');
         var FB = reqres.request('FB');
         FB.login(function(r) {
            if(r.status === 'connected'){
               //get user info
               FB.api('/me', function(data){

                  vent.trigger('auth:FBSignupCheck', data, function(){
                     that.ui.FBSignupBtn.button('reset');
                  });
               });
            }else{
               that.ui.FBSignupBtn.button('reset');
               
            }
         }, {scope: 'public_profile,email,user_friends, user_groups'});
      },
      onUsingEmailClick: function(){
         //this.ui.usingEmailBtn.hide();
         //this.ui.signupForm.show();
         //this.ui.signupBtn.show();
      },
      onLoginClick: function(){
         vent.trigger('navigate:login');
      }

    });
    
    return SignupPageView;
});
