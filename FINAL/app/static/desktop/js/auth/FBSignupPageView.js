define([
   'jquery',
   'underscore',
   'marionette',
   'app',
   'vent',
   'reqres',
   "text!auth/tpl-fb-signup-page.html",
   'auth/AuthForms'
],
function ($, _, Marionette, App, vent, reqres, FBSignupTpl, Forms) {
   "use strict";
   
   
   var FBSignupPageView = Marionette.ItemView.extend({
      template: FBSignupTpl,
      
      events:{
         'click @ui.FBSignupBtn' : 'onFinishFBSignupAttempt',
         //catching all 3 events just in case (see http://stackoverflow.com/questions/895171/prevent-users-from-submitting-form-by-hitting-enter)
         'keypress .form-group input'  : 'onKeyPress',
         'keydown .form-group input'   : 'onKeyPress'
      },
      initialize: function(options){
        this.data = options.data; 
        this.process = false;
      },
      serializeData: function(){
        return {
           first_name: this.data.first_name
        } 
      },
      ui:{
         signupForm: '.fb-signup-form',
         FBSignupBtn: '#fb-singup-btn'
      },
      onRender: function(){
         if(this.data.email){
            this.form = Forms.FBSignupForm.render();
         } else {
            this.form = Forms.FBSignupFormWithEmail.render();
            this.$('.email-required-too').removeClass('hide');

         }
         this.ui.signupForm.append(this.form.el);
         
         //focus 
         var that = this;
         setTimeout(function(){
            that.form.focus();
         }, 1); 

      },
      onKeyPress: function(evt){
         var k = evt.keyCode || evt.which;
         
         if(k == 13){
            evt.preventDefault(); 
            this.onFinishFBSignupAttempt();
            return false;  
         }
      },
      onFinishFBSignupAttempt: function(){
         if(this.process) return;
         
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors) return;
         
         var data = this.form.getValue();
         
         if(this.data.email){
            data.email = this.data.email;
         }
    
         this.process = true;
         this.ui.FBSignupBtn.button('loading');
         var that = this;
         // we will send username AND email
         vent.trigger('auth:FBsignupAttempt', data, 
            function(){
               that.process = false;
               that.ui.FBSignupBtn.button('reset');  
    
         });
      }

    });
    
    return FBSignupPageView;
});
