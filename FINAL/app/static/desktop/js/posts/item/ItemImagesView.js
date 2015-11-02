define([
   'marionette',
   'vent',
   'posts/PostModel',
   'text!posts/item/tpl-item-images.html',

],
function (Marionette, vent, Post, ItemImagesTpl) {
   "use strict";
   
   var ItemImagesView = Marionette.ItemView.extend({
      template: ItemImagesTpl,
      
      events:{
         'click .thumbnail-list-item'      : 'onThumbnailClick',
         'click .post-item-image-view'     : 'onClick',
         'mouseenter'            : 'onMouseEnter',
         'mouseleave'            : 'onMouseLeave',
         'mousemove'             : 'onMouseMove'
      },
      ui:{
         imgWrap: '.post-item-image-view',
         img: '.post-item-image-view img',
         leftControl: '.image_prev',
         rightControl: '.image_next'
      },
      
      initialize: function(options){
         this.listenTo(this.model, 'change:imgSelected', this.changeMainImage);
         this.listenTo(this.model,'change:status', this.renderStatus, this);
      },
      serializeData: function(){
         var data = this.model.toJSON();
         data = _.extend(data, {
            'has_images' : data.images.length>0
         }) ;
         return data;
      },
      onRender:function(){
         if(this.model.getImagesLength() <= 1){
            this.$(".image_control").addClass('hide');
            this.$(".thumbnail-list").addClass('hide');
         }else{
            //show the controls for a little bit
            this.$el.addClass('hover');
         }
         this.model.selectImage(0);
      },
      renderStatus: function(){
         if(this.model.is_active()){
            this.$(".sold-tag").addClass('hide');
         }else{
            this.$(".sold-tag").removeClass('hide');
         }
      },
      onThumbnailClick: function(e){
         this.model.selectImage(e.target.id);
      },
      changeMainImage: function(model){
         this.ui.imgWrap.find('img').attr('src', this.model.getSelectedImageSrc());
      },
      onImageOut: function(){
         this.ui.imgWrap.find('a').removeClass('hover');
      },
      onMouseEnter: function(){
         this.$el.addClass('hover');
      },
      onMouseLeave: function(){
         this.$el.removeClass('hover');
      },
      onMouseMove: function(evt){
         var posX = evt.clientX - this.$el.offset().left;
         // check if mouse in left or right half
         if(posX < this.$el.width()/2){
            this.ui.leftControl.addClass('active');
            this.ui.rightControl.removeClass('active');
         }else{
            this.ui.rightControl.addClass('active');
            this.ui.leftControl.removeClass('active');
         }
      },
      onClick: function(evt){
         var posX = evt.clientX - this.$el.offset().left;
         if(posX < this.$el.width()/2){
            this.model.selectPrevImage();
         }else{
            this.model.selectNextImage();
         }
      },
      beforeDestroy: function(){
         this.stopListening();
      }
      
   });
   
   return ItemImagesView;
});
