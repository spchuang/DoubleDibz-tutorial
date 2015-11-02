define([
   'marionette',
   'vent',
   'messages/models/ChatModel',
   'messages/messageView/MessageForm',
   "bootstrap-modal"
],
function (Marionette, vent,ChatModel, MessageForm) {
   'use strict';

   var ModalContent = Marionette.ItemView.extend({
      ui:{
         ContactSellerForm : '#contact-form'
      },
      initialize: function(options){
         
      },
      template: "<div id='contact-form'></div>",
      onRender: function(){
         this.form = MessageForm.render();
         this.ui.ContactSellerForm.append(this.form.el);
      }
   });
   
   //wraps modal instantiation in a function so we get a new copy everytime
   return function(options){ 
      
      var modal = new Backbone.BootstrapModal({
         animate: true,
         content: new ModalContent(),
         title: 'Contact seller',
         okText: 'Send',
         focusOk: false,
      }).open();
      
      modal.on('ok', function(){
         //validate modal content
         var form = modal.options.content.form;
         var errors = form.validate();
         if(errors){
            return modal.preventClose();
         }
         var data = _.extend(form.getValue(), {
            post_id: options.post_id
         });
         
         var that = this;

         //attempt create chat
         var chat = new ChatModel();
         chat.save(data,{
            wait:true,
            success : function(model, res){         
               vent.trigger("flash:alert", {type: 'success', msg: res});
               that.trigger('createChat:ok', chat.toJSON());
            },error: function(collection, res, options){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
            
         });
         
      });
      
      return modal;  
   }
   
      
});
