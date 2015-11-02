define([
   'marionette',
   'vent',
   'reqres',
   "text!auth/tpl-forgot-password-page.html",
   'auth/AuthForms'
],
function (Marionette, vent, reqres, ForgotPasswordTpl, Forms) {
   "use strict";

   
   var ForgotPasswordPageView = Marionette.ItemView.extend({
      template: ForgotPasswordTpl,
      
      initialize: function(){
         
      },
      ui:{
         emailForm: '#email-form',
         sendBtn:   '#send-email-btn'
      },
      onRender: function(){
         this.form = Forms.EmailForm.render();
         this.ui.emailForm.append(this.form.el);
      },
      
      events:{
         'click @ui.sendBtn' :  'onSendEmailAttempt',
         'keyup'						:	'onKeyUp'
      
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault(); 
             
         if(k == ENTER_KEY){
            this.onSendEmailAttempt();
         }
         
      },
      onSendEmailAttempt: function(){
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors) return;
         
         var that = this;
         this.ui.sendBtn.button('loading');
         reqres.request('session').forgotPassword(this.form.getValue(),{
            success: function(res){
               vent.trigger("close:modal");
               vent.trigger('navigate:home');
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
               that.ui.sendBtn.button('reset');
            }
         });

      }
    });
    
    return ForgotPasswordPageView;
});
