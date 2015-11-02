define([
   'underscore',
   'marionette',
   'vent',
   'messages/messageView/MessageForm',
],
function (_, Marionette, vent, MessageForm) {
   'use strict';
   /*
       Message input renders the 'message input box'. 
       
      @options
         - sendOnEnter: if false, it will generate a button. If true, pressing enter will trigger send
   */
   
   var MessageInputView = Backbone.Marionette.ItemView.extend({
      template: '<div id="message-input-form"></div>',
      initialize: function(options){
         options || (options = {});
         this.options.sendOnEnter = options.sendOnEnter || 'true';
      },
      ui:{
         inputForm: '#message-input-form',
      },
      events:{
         'keypress @ui.inputForm': 'sendOnEnter',
      },
      onRender: function(){
         this.form = MessageForm.render();
         this.ui.inputForm.append(this.form.fields.message.editor.el);
      },
      sendOnEnter: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;

         //submit on Enter key. shift-enter will still create new line
         if(k == ENTER_KEY && !evt.shiftKey){
            evt.preventDefault(); 
            this.onMessageSend();
         }

      },
      onMessageSend: function(){
         var errors = this.form.validate();
         if(errors){ return; }
         
         var that = this;
         return this.trigger('messageSubmit', this.form.getValue(), function(){
            that.resetForm();
         });
      },
      resetForm: function(){
         if(this.form) this.form.setValue({message:''});
      }
   
   });   
   return MessageInputView;
});
