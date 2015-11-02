define([
   'jquery',
   'marionette',
   'vent',
   'buy_requests/BuyRequestModel',
   'buy_requests/edit/BaseView',
   "text!buy_requests/edit/tpl-create-buy-request.html",
   "general/FlashMessageView",
   'backbone-forms',
   'bbf-bootstrap3',
   
],
function ($, Marionette, vent, BuyRequest, BaseView, CreateBuyRequestTpl, FlashMessageView) {
   "use strict";
   
   var CreateBuyRequestPageView = BaseView.extend({
      template: CreateBuyRequestTpl,
      initialize: function(options){    
         this.initializeBase(options);      
         
         // select first category
         this.form.setValue({categories: this.categories.at(0).get('name')});
      },
      ui: _.extend({}, BaseView.prototype.ui, {
         BuyRequestForm: '#create-buy-request-form',
         createBtn: '#create-btn'
      }),
      events: _.extend({}, BaseView.prototype.events, {
         'click @ui.createBtn' : 'createBuyRequest',
      }),
      onRender: function(){
         //display create form
         this.renderBase();
      },
      createBuyRequest: function(){
         //validate form
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors){  
            $(document).scrollTop(0);
            return; 
         }
             
         //start creating...disable button
         this.ui.createBtn.button('loading');

         var that = this;
         
         this.model.save(this.getFormValue(),{
               wait: true,
               success: function (model, res) {
                  vent.trigger("navigate:account:posts");
                  vent.trigger("flash:alert", {type: 'success', msg: res});
               },
               error: function (model, res, options) {
                  vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
                  that.ui.createBtn.button('reset');
               }
               
            });   
      }
      
   });
   
   return CreateBuyRequestPageView;
});
