define([
   'marionette',
   'vent',
   'posts/PostModel',
   'posts/CommentModel',
   'text!posts/item/tpl-item-layout.html',
   'text!posts/item/tpl-item-buyer-action.html',
   'posts/item/ItemSellerActionView',
   'posts/item/ItemBuyerActionView',
   'posts/item/ItemImagesView',
   "posts/item/ItemCommentsView",
   'templates/TimeagoView',
   'templates/UserProfileView',
   'templates/HashtagsView',
   'jQuery-linkify'

],
function (Marionette, vent, Post, CommentCollection, ItemLayoutTpl, ItemHeaderBuyerTpl, ItemSellerActionView, ItemBuyerActionView, ItemImagesView, ItemCommentsView, TimeagoView, UserProfileView, HashtagsView) {
   "use strict";
   
   var ItemPostPageView = Marionette.LayoutView.extend({
      template: ItemLayoutTpl,
      
      events:{
         
         'click @ui.postPrev': 'onPrevPostClick',
         'click @ui.postNext': 'onNextPostClick',
         'click .fb-share-btn'     : 'onfbShareClick',
      },
      ui:{
         bookmarkLabel  : '.bookmark-label',
         postPrev: '.post-prev',
         postNext: '.post-next'
      },
      regions:{
         action: '.post-item-action',
         images: '.post-item-images-side',
         comments: '.post-item-comments',
         timeago: '.timeago-region',
         userProfile: '.user-profile-region',
         hashtags: '.hashtags-region'
      },
      initialize: function(options){
         this.model = options.model;
         this.prevenResetUrl = false;
         this.fromURL = options.fromURL;
         
         this.listenTo(this.model,'change:is_bookmarked', this.renderBookmark, this);
         
         // check if we're at front or end
         if(this.model.modalMode){
            this.goPrev = true;
            this.goNext = true;
            if(this.model.collection){
               var index = this.model.collection.indexOf(this.model);
               if(index === 0){
                  this.goPrev = false;
               }else if(index === this.model.collection.length -1){
                  this.goNext = false;
               }       
            }
         }
      },
      
      onfbShareClick: function(){
         vent.trigger("posts:fb:share", this.model.id);         
      },
      onRender: function(){
         //if in modal mode, click name to go to indivisual page
         if(this.model.modalMode){
            //hide arrow, if there isn't enough front and end
            if(!this.goPrev){
               this.ui.postPrev.addClass('hide');
            }
            if(!this.goNext){
               this.ui.postNext.addClass('hide');
            }
         
            var that = this;
            if (window.history.replaceState) {
               window.history.replaceState({}, '', '/posts/'+ this.model.id);
            }
            
            this.$el.find(".name-link").attr('title', 'See post page').tooltip({
               placement: 'bottom'
            }).click(function(){
               vent.trigger("close:modal");
               vent.trigger("navigate:posts:item", that.model.id);
            });
            //bind keypress events
            var that = this;
            $("body").on("keyup.postPopupNavigate", function(evt) {
               var k = evt.keyCode || evt.which;
               var LEFT = 37, RIGHT = 39, ESC = 27;
               if(k == LEFT){
                  that.onPrevPostClick();
               }else if(k == RIGHT){
                  that.onNextPostClick();
               }else if(k == ESC){
                  vent.trigger("close:modal");
               }
            });
         }
      
         // show specific action view
         if(this.model.is_owner()){
            this.action.show(new ItemSellerActionView({model: this.model}));
         }else{
            this.action.show(new ItemBuyerActionView({model: this.model}));
         }
         
         //linkify description
         this.$(".post-description").linkify();
         
         //render the different fields
         this.images.show(new ItemImagesView({model: this.model}))
         
         //lazy load comments section
         var comments = new CommentCollection([], {post_id:this.model.id});
         var that = this;
         vent.trigger("region:deferredShow", this.comments, comments.fetch(), {
            success: function(res){
               if(that.comments){
                  that.comments.show(new ItemCommentsView({model:that.model, collection: comments}));
               }
            },error: function(res){
                vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
         
         //timeago
         this.timeago.show(new TimeagoView({
            time: this.model.get('created_at'),
            showTooltip: true
         }));
         
         //user profile
         this.userProfile.show(new UserProfileView({
            user: this.model.get('user'),
            modalMode: this.model.modalMode
         })); 
         
         //hashtags
         this.hashtags.show(new HashtagsView({
            hashtags: this.model.get('hashtags'),
            modalMode: this.model.modalMode
         }));
      },
      renderBookmark: function(){
         var bookmark = this.model.get('is_bookmarked');
         //render btn
         if(!bookmark){
            this.ui.bookmarkLabel.empty().append('<span class="label label-success">'+bookmark+'</span>');
         }else{
            this.ui.bookmarkLabel.empty().append('<span class="label label-danger">'+bookmark+'</span>');
         }          
      },
      onPrevPostClick: function(){  
         if(this.goPrev){
            this.prevenResetUrl = true;
            vent.trigger('open:modal:post', this.model.collection.prev(), this.fromURL);
         }
      },
      onNextPostClick: function(){
         if(this.goNext){
            this.prevenResetUrl = true;
            vent.trigger('open:modal:post', this.model.collection.next(), this.fromURL);
         }
      },
      onBeforeDestroy: function(){
         // if we're in modal mode, revert to old url
         if(this.model.modalMode && window.history.replaceState && !this.prevenResetUrl){
            window.history.replaceState({}, '', '/'+this.fromURL);
         }
         $("body").off("keyup.postPopupNavigate");

      }
      
   });
   
   return ItemPostPageView;
});
