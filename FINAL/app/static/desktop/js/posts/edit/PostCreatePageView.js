define([
   'jquery',
   'marionette',
   'vent',
   'posts/PostModel',
   "text!posts/edit/tpl-create-posts.html",
   'posts/edit/BaseView'
   
],
function ($, Marionette, vent, PostCollection, CreatePostTpl, BaseView) {
   "use strict";

   var CreatePostsPageView = BaseView.extend({
      template: CreatePostTpl,
      initialize: function(options){
         this.initializeBase(options);
         this.block_create = false;
    
         // select first category
         this.form.setValue({categories: this.categories.at(0).get('name')});
      },
      ui: _.extend({}, BaseView.prototype.ui, {
         PostForm    : '#create-post-form',
         createBtn   : '#create-btn',
      }),
      events: _.extend({}, BaseView.prototype.events, {
         'click @ui.createBtn' : 'createPost',
      }),
      onRender: function(){
         //display create form
         this.renderBase();
         
         //Listen to upload manager blocks
         var that = this;
         this.listenTo(this.uploadManager, 'uploadManager:start', function(){
            that.block_create = true;
         });
         this.listenTo(this.uploadManager, 'uploadManager:done', function(){
            that.block_create = false;
         });         
      },
      createPost: function(){
         //Check if button is currently blocked
         if(this.block_create){
            return;
         }
         
         //validate form
         var errors = this.validate();
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
                  vent.trigger("navigate:posts:item", that.model.id);
                  vent.trigger("flash:alert", {type: 'success', msg: res});
               },
               error: function (model, res, options) {
                  vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
                  that.ui.createBtn.button('reset');
               }
               
            });    
      }
   });
   
   return CreatePostsPageView;
});
