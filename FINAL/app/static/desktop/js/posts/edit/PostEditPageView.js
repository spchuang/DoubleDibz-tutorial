define([
   'marionette',
   'vent',
   'posts/PostModel',
   "text!posts/edit/tpl-post-edit.html",
   'posts/edit/BaseView'
   

],
function (Marionette, vent, Post, EditPostTpl, BaseView) {
   "use strict";
   
      
   var PostEditPageView = BaseView.extend({
      template: EditPostTpl,
      initialize: function(options){    
         this.initializeBase(options);
         this.block_edit = false;
      },
      ui: _.extend({}, BaseView.prototype.ui, {
         PostForm    : '#edit-post-form',
         saveBtn     : '#save-btn',
      }),
      
      events: _.extend({}, BaseView.prototype.events,{
         'click @ui.saveBtn' : 'editPost'
      }),
      onRender: function(){
         //set form value
         this.form.setValue({
            name: this.model.get('name'),
            price: this.model.get('price'),
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
         
         //Listen to upload manager blocks
         var that = this;
         this.listenTo(this.uploadManager, 'uploadManager:start', function(){
            that.block_edit = true;
         });
         this.listenTo(this.uploadManager, 'uploadManager:done', function(){
            that.block_edit = false;
         });                  
      },
      editPost: function(){
         //Check if button is currently blocked
         if(this.block_edit){
            return;
         }
      
         //validate form
         var errors = this.validate();
         if(errors){  
            return $(document).scrollTop(0);
         }
   
         //start creating...disable button
         this.ui.saveBtn.button('loading');
         
         var that = this;
         this.model.save( this.getFormValue(), {
            patch: true,
            wait: true,
            success: function(model,res){
               vent.trigger("navigate:posts:item", that.model.id);
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(model, res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
               that.ui.saveBtn.button('reset');
            }
         });
            

      }
      
   });
   
   return PostEditPageView;
});
