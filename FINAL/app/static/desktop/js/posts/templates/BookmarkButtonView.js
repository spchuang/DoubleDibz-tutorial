define([
   'underscore',
   'marionette',
   'vent',
   'reqres',
],
function (_, Marionette, vent, reqres) {
   "use strict";
   var bookmarkBtnTpl ='<a href="#" class="btn btn-primary btn-block bookmark-btn"></a>';

   var BOOKMARKED_TEXT = '<span class="glyphicon glyphicon-star"></span>Bookmarked';
   var BOOKMARK_TEXT = '<span class="glyphicon glyphicon-star-empty"></span>Bookmark';
   
   var BookmarkButtonView = Marionette.ItemView.extend({
      template: bookmarkBtnTpl,
      initialize: function(options){
         this.listenTo(this.model,'change:is_bookmarked', this.renderText, this);
      },
      tagName: 'span',
      ui: {
        bookmarkBtn: '.bookmark-btn' 
      },
      events: {
         'click @ui.bookmarkBtn' : 'onClick'
      },
      onRender: function(){
         this.renderText(); 
      },
      renderText: function(){
         //if not logged in show bookmark
         if(!reqres.request('isLoggedIn')){
            this.ui.bookmarkBtn.html(BOOKMARK_TEXT);
            return;
         }
      
         var isBookmark = this.model.getBookmarkStatus();
         if(_.isBoolean(isBookmark)){
            //render btn text
            if(isBookmark){
               this.ui.bookmarkBtn.html(BOOKMARKED_TEXT);
            }else{
               this.ui.bookmarkBtn.html(BOOKMARK_TEXT);
            }  
         }else{
            this.ui.bookmarkBtn.html("<img src='/static/img/ajax-loader-bg-green.gif'>");  
         }
      },
      onClick: function(){
         vent.trigger("posts:bookmarkAttempt", this.model);
      }
   });
   
   return BookmarkButtonView;
});