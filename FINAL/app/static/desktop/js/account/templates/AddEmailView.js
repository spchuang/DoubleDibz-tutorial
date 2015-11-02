define([
   'marionette',
   'app',
   'vent',
   'reqres',
   "account/settings/EmailCollection",
   'backbone-forms'
],
function (Marionette, App, vent, reqres, EmailCollection) {
   "use strict";

   var AddEmailView = Marionette.ItemView.extend({
      template: '<span class="add-email-form"></span>',
      ui:{
         addEmailForm: '.add-email-form',
      },
      events:{
         'keyup @ui.addEmailForm': 'onKeyUp',
      },
      tagName: 'span',
      initialize: function(options){
         options = options || {};
         this.preventOnEnter = options.preventOnEnter || false; 
         
         if(!this.collection){
            this.collection = new EmailCollection();
         }
         
         // declare here because we may have 2 instances on the same page
         var AddEmailForm = new Backbone.Form({
             schema: {
               email: { type: 'Text', validators: ['required', 'email'], editorAttrs:{placeholder: 'New Email'} }
             },
             idPrefix: 'input-'
         });
         this.form = AddEmailForm.render();
      },
      onRender: function(){
         
         this.ui.addEmailForm.append(this.form.fields.email.editor.el);
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which;
         
         if(k == reqres.request('KEYS').ENTER && !this.preventOnEnter){
            evt.preventDefault(); 
            this.addEmailFromInput();
         }
      }, 
      addEmailFromInput: function(){
         var errors = this.form.validate();
         if(errors){
            vent.trigger("flash:alert", {type: 'error', msg: 'Email: '+errors.email.message});
            return;
         }
         
         this.attemptCreateEmail(this.form.getValue());
      },
      attemptCreateEmail: function(data){
         this.form.setValue({email:''});
         this.trigger("create:email:loading");
         var that = this;
         this.collection.create(data, {
            wait: true,
            success : function(model, res){         
               that.collection.add(model);
               that.form.setValue({email:'', password:''});
               
               that.trigger("create:email:success", res);
            },error: function(collection, res, options){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            },complete: function(){
               that.trigger("create:email:finish");
            }
         });
      }
      
   });
   return AddEmailView;
   
});