define([
   'jquery',
   'marionette',
   'vent',
   'reqres',
   'posts/PostModel',
   'text!posts/item/tpl-item-seller-action.html',
   'timeago',
],
function ($,Marionette, vent, reqres, Post, ItemSellerActionTpl) {
   "use strict";
   
   var ItemSellerActionView = Marionette.ItemView.extend({
      template: ItemSellerActionTpl,
      
      events:{
         'click #edit-btn': 'onEditClick',
      },
      onRender: function(){
         //hide buttons if canvas page
         if(is_canvas){
            this.hideButtons();
         }
      },
      onEditClick: function(){
         var id = this.model.id;
         if(this.model.modalMode){
            vent.trigger("close:modal");
         }
         vent.trigger("navigate:posts:edit", id);   
      },
      hideButtons: function(){
         this.$('#edit-btn').hide();
         this.ui.toggleStatusBtn.hide();
      },
      
   });
   
   return ItemSellerActionView;
});
