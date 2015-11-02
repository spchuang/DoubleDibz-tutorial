define([
   'marionette',
   'vent',
   'posts/PostModel',
   'posts/templates/PostItemView'
],
function (Marionette, vent, Post, PostItemView) {
   "use strict";
   var NoChildsView = Backbone.Marionette.ItemView.extend({
     template: "<p>No posts.</p>"
   });
   var EmptyCreateNewView = Backbone.Marionette.ItemView.extend({
     template: '<a class="create-new"> \
                  <span class="glyphicon glyphicon-plus"></span>\
                </a>',
      events: {
         'click .create-new': function(){
            vent.trigger('navigate:createPost');
         }
      },
      onRender: function(){
         this.$('.create-new').attr('title', 'Sell an item!').tooltip({
            placement: 'bottom'
         });
      }
   });
   
   var ListPostsPageView = Marionette.CollectionView.extend({
      id: 'post-list-wrapper',
      childView: PostItemView,
      getEmptyView: function(){
         // if we're the owner of the page, then show "create new post" icon
         if(this.is_owner){
            return EmptyCreateNewView;
         }
         return NoChildsView;
      },
      childViewOptions: function(){
         return {
            is_owner: this.is_owner
         };
      },
      initialize: function(options){
         this.is_owner = options.is_owner || false;
      },
      onDestroy: function(){
         $(window).off('resize.unveil scroll.unveil lookup.unveil');
      }
   });
   
   
   return ListPostsPageView;
   
});
