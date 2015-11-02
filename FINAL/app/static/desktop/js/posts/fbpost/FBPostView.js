define([
   'underscore',
   'marionette',
   'vent',
   'reqres',
   'templates/TimeagoView',
   'posts/templates/BookmarkButtonView',
   'text!posts/fbpost/tpl-fbpost-view.html',
   'posts/item/ItemImagesView',
   'templates/HashtagsView',
   'jQuery-linkify'
],
function (_, Marionette, vent, reqres, TimeagoView, BookmarkButtonView, FBPostViewTpl, ItemImagesView, HashtagsView) {
   "use strict";

   
   var FBPostView = Marionette.LayoutView.extend({
      template: FBPostViewTpl,
      
      events:{
         'click @ui.postPrev': 'onPrevPostClick',
         'click @ui.postNext': 'onNextPostClick'
      },
      regions:{
         images: '.post-item-images-side',
         timeago: '.timeago-region',
         bookmarkBtn: '.bookmark-btn-region',
         hashtags: '.hashtags-region'
      },
      initialize: function(options){
         this.prevenResetUrl = false;
         this.fromURL = options.fromURL;
         // duplcicate thumbnail
         this.model.attributes.images = _.map(this.model.get('images'), function(val){
            return _.extend(val, {
               'thumbnail': val.link
            })
         });
         
         // this hash doesn't mean anything
         if (window.history.replaceState) {
            window.history.replaceState({}, '', '/posts/fb/');
         }
         
         // check if we're at front of end
         this.goPrev = true;
         this.goNext = true;
         var index = this.model.collection.indexOf(this.model);
         if(index === 0){
            this.goPrev = false;
         }else if(index === this.model.collection.length -1){
            this.goNext = false;
         }
      },
      ui:{
         postPrev: '.post-prev',
         postNext: '.post-next',
      },
      onRender: function(){ 
         this.images.show(new ItemImagesView({model: this.model}))
         //hide arrow, if there isn't enough front and end
         if(!this.goPrev){
            this.ui.postPrev.addClass('hide');
         }
         if(!this.goNext){
            this.ui.postNext.addClass('hide');
         }
         
         this.timeago.show(new TimeagoView({
            time: this.model.get('created_at'),
            showTooltip: true
         }));
         
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
         
         //linkify description
         this.$(".post-description").linkify();
         
         // render bookmark
         this.bookmarkBtn.show(new BookmarkButtonView({model: this.model}));
         
         //hashtags
         this.hashtags.show(new HashtagsView({
            hashtags: this.model.get('hashtags'),
            modalMode: true
         }));
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
         if(window.history.replaceState && !this.prevenResetUrl){
            window.history.replaceState({}, '', '/'+this.fromURL);
         }
         $("body").off("keyup.postPopupNavigate");
      }
      
   });
   
   return FBPostView;
});
