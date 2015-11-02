define([
   'marionette',
   'vent',
   'posts/PostModel',
   'buy_requests/BuyRequestModel',
   'posts/templates/PostListView',
   'buy_requests/templates/BuyRequestListView',
   'search/SearchFilterView',
   'text!search/tpl-search-layout.html'
],
function (Marionette, vent, Post, BuyRequest, PostlistView, BuyRequestListView, SearchFilterView, SearchPageLayoutTpl) {
   "use strict";   

   var SearchPageView = Marionette.LayoutView.extend({
      template: SearchPageLayoutTpl,
      regions:{
         resultRegion: '.search-results-region',
         filterRegion: '.search-filter-region',
         pagination      : '#post-list-pagination' 
      },
      ui:{
         upBtn:   '.navigate-up',
      },
      events: {
         'click @ui.upBtn' : 'onUpClick'
      },
      className: "search-page-view",
      initialize: function(options){  
         this.search = options.search;
         this.type = options.search.args.type;
         this.posts = new Post.collection();
         this.buy_requests = new BuyRequest.collection();
         this.filterView = new SearchFilterView({search: this.search});
         this.pager = null;
         this.triggerLoadOffset = 600; // trigger infinite scrolling from the bottom
         
         //create throttle version
         this.checkScroll = _.throttle(this.checkScroll, 30);
         this.setCollection();
      },
      updateSearch: function(newSearch){
         this.search = newSearch; 
         this.type = newSearch.args.type;
         this.filterView.search = newSearch;
         this.filterView.renderDynamic();
         this.setCollection();
      },
      onShow: function(){
         var promise = this.search.getPosts();
         var that = this;
         vent.trigger('region:deferredShow', this.resultRegion, promise, {
            success: function(res){
               that.collection.reset(res.data.result);
               that.pager = _.pick(res.data, 'total', 'page', 'per_page');
               that.filterView.updateResultTotal(that.pager.total);
               if(that.type == "sell"){
                  that.resultRegion.show(new PostlistView({collection: that.collection}));
               }else{
                  that.resultRegion.show(new BuyRequestListView({collection: that.collection}));
               }
            },error: function(res){
                vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      onRender: function(){  
         this.filterRegion.show(this.filterView);
         // register infinite scrolling event
         $(window).on('scroll.listPage', _.bind(this.checkScroll, this));
      },
      loadNext: function(){
         var that = this;
         this.search.loadNextPage().done(function(res){
            that.collection.add(res.data.result);
         })
         .fail(function(mod, res){
            vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
         })
      },
      onUpClick: function(){
         $("body").scrollTop(0);    
      },
      checkScroll: function () {
         // show "go up" button
         if(window.scrollY > 300){
            this.ui.upBtn.addClass('show');
         }else{
            this.ui.upBtn.removeClass('show');
         }
      
         if( this.search.isLoading || this.pager.total <= this.collection.length){
            return;
         }
         
         // check for infinite scrolling
         if (((window.innerHeight + window.scrollY + this.triggerLoadOffset) >= document.body.offsetHeight)) {
            this.loadNext();
         }
      },
      onDestroy: function(){
         $(window).off('scroll.listPage');
      },
      setCollection: function() {
         if(this.type === "sell"){
            this.collection = this.posts; 
         }else{
            this.collection = this.buy_requests;
         }
      }
      
   });
   return SearchPageView;
});
