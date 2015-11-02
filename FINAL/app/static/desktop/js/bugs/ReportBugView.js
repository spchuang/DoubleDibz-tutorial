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
   var ReportBugForm = new Backbone.Form({
       schema: {
         name: { type: 'Text', title: 'Title', validators: ['required'], editorAttrs:{placeholder: 'Brief Title'}},
         description: { type: 'TextArea', validators: ['required'], editorAttrs:{placeholder: 'Description', rows:'6'}}
       },
       idPrefix: 'input-'
   });

   //TODO: bug when click outside the modal, the modal simply hides and isn't removed from the DOM.
   var ModalContent = Marionette.ItemView.extend({
      ui:{
         reportBugForm : '#report-form'
      },
      initialize: function(){
         this.listenTo(this, "ok", this.onOkClick); 
      },
      template: "<p class='text-center'>Tell us what we can improve!</p><div id='report-form'></div>",
      onRender: function(){
         this.form = ReportBugForm.render();
         this.ui.reportBugForm.append(this.form.el);
         
      },
      validate: function(){
         //return false if error
         return!this.form.validate();
      }
   });
   
   return ModalContent;
    
});
