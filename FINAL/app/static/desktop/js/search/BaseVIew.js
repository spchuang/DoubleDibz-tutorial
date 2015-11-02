define([
   'marionette',
   'vent',
   'posts/templates/PaginationView',
   'text!search/tpl-search-layout.html'
   
],
function (Marionette, vent, PaginationView, SearchPageLayout) {
   "use strict";
   
   var BaseView = Marionette.LayoutView.extend({
      template: SearchPageLayout,
      regions:{
         searchResultWrap: '#search-results',
         pagination      : '#post-list-pagination' 
      },
      initializeBase: function(options){
         /*
            Sets the collection and pager
         */
         this.collection = options.collection;
         this.pager = options.pager;
      },
      renderBase: function(){
         /*
         this.pagerView = new PaginationView({pager: this.pager});
         //render pagination

         this.pagination.show(this.pagerView);
         
         //set callback to pager 
         this.listenTo(this.pagerView, 'pagination:goto', _.bind(this.onPagerGo, this));
         */
      }
   });
   return BaseView;
});
