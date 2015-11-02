define([
   'marionette',
   'vent',
   "reqres",
   'posts/PostModel',
   'posts/templates/PostListView',
],
function (Marionette, vent, reqres, Post, PostlistView) {
   "use strict";
   
   var BookmarkView = Marionette.LayoutView.extend({
      template: "<h3>My Bookmarks</h3><hr><div class='post-wrap'></div>",
      regions:{
         postWrapRegion: ".post-wrap"
      },
      initialize: function(options){
         this.collection = options.collection;
      },
      onShow: function(){
         this.postWrapRegion.show(new PostlistView({collection: this.collection}));
      }
   });
   
   return BookmarkView;
});
