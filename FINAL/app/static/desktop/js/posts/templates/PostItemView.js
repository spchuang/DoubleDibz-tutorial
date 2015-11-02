define([
   'underscore',
   'handlebars',
   'marionette',
   'vent',
   'posts/PostModel',
   'text!posts/templates/tpl-post-list-item.html',
   'jquery.unveil',

],
function (_, Handlebars, Marionette, vent, Post, PostItemTpl) {
   "use strict";

   var FB_ICON_TITLE = 'From FB free&for sale';

   var ItemPostPageView = Marionette.ItemView.extend({
      defaults:{
         imgRatio : 5/4,//3/2,
         unveilThreshold: 1000,
         debounce: 60,
      },
      template: PostItemTpl,
      tagName: 'div',
      className: 'col-xs-12 col-sm-6 col-md-4 col-lg-3 nopadding',
      initialize: function(options){
         this.listenTo(this.model, 'change:imgSelected', this.changeMainImage);
         this.is_owner = options.is_owner||false;
   

      },
      events: {
         'click @ui.container': 'onClick',
         'click .item-name'   : 'onNameClick',
         'click .list-item-prev' : 'onPrevImgClick',
         'click .list-item-next' : 'onNextImgClick',
         'click .list-item-edit' : 'onEditClick',
         'click .list-item-delete': 'onDeleteClick'
      },
      ui:{
         container: '.post-list-item',
         imgLink: '.post-list-item a',
         img : '.post-list-item .list-item-img',
      },
      onRender: function(){
         this.ui.container.popover({
            placement: function (context, source) {
               var top = $(source).offset().top - window.scrollY;
               
               if (top > 110) {
                  return "top";
               }
               
               return "bottom";
            },
            trigger: 'hover',
            html: true,
            container: this.ui.container,
            animation: true,
         });
         
         if(this.model.getImagesLength() <= 1){
            this.$(".list-item-next, .list-item-prev").addClass('hide');
         }
         //bypass event trigger
         this.model.imgSelected = 0;
      },
      onShow: function(){
         this.ui.img.on('unveil', _.bind(this.onLoad, this))
                    .unveil({
                       threshold : this.defaults.unveilThreshold,
                       debounce  : this.defaults.debounce
                    });
      },
      onLoad: function(){
         var that = this;
         this.ui.img.load(function() {
            that.updateCSS();
            this.style.opacity = 1;
            this.style.border = 0;
            
         }).bind('error', function() {
            console.log('[INFO] image did not load. ' + that.model.get("feed_id"));
            // This is a temporary fix
            //that.model.collection.remove(that.model);
            //that.destroy();
         });;
      },
      updateCSS: function(){
         //determine the aspect ratio
         var imgH = this.ui.img.height();
         var imgW = this.ui.img.width();
         
         if ( (imgW/imgH) < this.defaults.imgRatio) { 
            this.ui.container.removeClass("landscape").addClass("portrait");
         } else {
            this.ui.container.removeClass("portrait").addClass("landscape");
         }
      },
      onClick: function(evt){
         //only trigger if we're clicking exactly on the img background
         if($(evt.target).attr("class") === "list-item-img"){
            vent.trigger('open:modal:post', this.model);
         }

      },
      changeMainImage: function(model){
         this.ui.container.find('img').attr('src', this.model.getSelectedImageSrc(true));
         this.updateCSS();
      },
      onNameClick: function(){
         vent.trigger("navigate:posts:item", this.model.id);
      },
      onPrevImgClick: function(){
         this.model.selectPrevImage();
      },
      onNextImgClick: function(){
         this.model.selectNextImage();
      },
      beforeDestroy: function(){
         this.stopListening();
      },
      
      //-------Owner post control
      onEditClick: function(){
         vent.trigger("navigate:posts:edit", this.model.id);
      },
      onDeleteClick: function(){
         vent.trigger('posts:deleteAttempt', this.model);
      }
   });
   
   return ItemPostPageView;
});
