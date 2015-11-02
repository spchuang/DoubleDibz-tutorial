define([
   'marionette',
   'vent',
   'buy_requests/BuyRequestModel',
   'buy_requests/edit/BaseView',
   "text!buy_requests/edit/tpl-edit-buy-request.html",
   'backbone-forms',
   'bbf-bootstrap3'

],
function (Marionette, vent, Post, BaseView, EditBuyRequestTpl) {
   "use strict";
      
   var EditBuyRequestPageView = BaseView.extend({
      template: EditBuyRequestTpl,
      ui: _.extend({}, BaseView.prototype.ui, {
         BuyRequestForm : '#edit-buy-request-form',
         saveBtn : '#save-btn',
      }),
      events: _.extend({}, BaseView.prototype.events,{
         'click @ui.saveBtn' : 'editBuyRequest'
      }),
      initialize: function(options){     
         this.initializeBase(options);
      },
      onRender: function(){
         //set form value
         this.form.setValue({
            name: this.model.get('name'),
            description: this.model.get('description'),
            //get first category 
            categories: this.categories.getCategory(this.model.get('hashtags'))
         });
         
         //display create form
         this.renderBase();
         
         var that = this;
         _.each(this.model.get('hashtags'), function(value){
            that.tags.tagsinput('add', value);
         }); 
      },
      editBuyRequest: function(){
         //Check if button is currently blocked
         if(this.block_edit){
            return;
         }
      
         //validate form
         var errors = this.validate();
         if(errors){  
            $(document).scrollTop(0);
            return; 
         }
   
         //start creating...disable button
         this.ui.saveBtn.button('loading');
         
         var that = this;
         this.model.save( this.getFormValue(), {
            patch: true,
            wait: true,
            success: function(model,res){
               vent.trigger("navigate:account:posts");
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(model, res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
               that.ui.saveBtn.button('reset');
            }
         });
      }
   });
   
   return EditBuyRequestPageView;
});
