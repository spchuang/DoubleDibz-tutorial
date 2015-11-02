define([
   'backbone-forms',
   'bbf-bootstrap3'
],
function () {
   'use strict';
   var MessageForm = new Backbone.Form({
       schema: {
         message: { type: 'TextArea', validators: ['required'], editorAttrs:{placeholder: 'Type your message...', rows:3}}
       },
       idPrefix: 'input-'
   });
   
   return MessageForm;
   
});
