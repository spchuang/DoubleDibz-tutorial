define([
   'marionette',
   'app',
   'vent',
   'backbone-forms',
   'bbf-bootstrap3',
   "bootstrap-modal"
],
function (Marionette, App, vent) {
   'use strict';
   var PaswordRequiredForm = new Backbone.Form({
       schema: {
         password: { type: 'Password', validators: ['required'], editorAttrs:{placeholder: 'Confirm your password'} }
       },
       idPrefix: 'input-'
   });

   //TODO: bug when click outside the modal, the modal simply hides and isn't removed from the DOM.
   var ModalContent = Marionette.ItemView.extend({
      ui:{
         passwordForm : '#password-form'
      },
      events:{
         'keyup @ui.passwordForm': 'onKeyUp',
      },
      initialize: function(){
         this.listenTo(this, "ok", this.onOkClick); 
      },
      template: "<div id='password-form'></div>",
      onRender: function(){
         this.form = PaswordRequiredForm.render();
         this.ui.passwordForm.append(this.form.fields.password.editor.el);
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault(); 
             
         if(k == ENTER_KEY){
            this.trigger('ok');
         }
      }
   });
      
   //wraps modal instantiation in a function so we get a new copy everytime
   return function(){ 
      var view = new ModalContent();
      var modal = new Backbone.BootstrapModal({
         animate: true,
         content: view,
         title: 'Confirm password to continue',
         okText: 'Confirm Password',
         focusOk: false,
      }).open();
      
      modal.listenTo(view, 'ok', function(){
         var form = modal.options.content.form;
         var errors = form.validate();
         if(errors){
            return;
         }
         
         modal.close();
         modal.trigger('ok');
      });
      
      modal.on('ok', function(){
         //validate modal content
         var form = modal.options.content.form;
         var errors = form.validate();
         if(errors){
            return modal.preventClose();
         }
         
         //return data
         modal.trigger('validate:ok', form.getValue());
      });
      
      
      return modal;  
   }
   
      
});
