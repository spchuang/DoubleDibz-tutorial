define([
    'underscore',
    'marionette', 
    'vent',
    "text!header/tpl-category-item.html",
], function(_, Marionette, vent, CategoryItemTpl){
   'use strict';
   
   var CategoryItemPageView = Marionette.ItemView.extend({
      template: CategoryItemTpl,
      tagName: 'li',
      events:{
         'click .category-item': 'onDropdownClick',
      },
      onDropdownClick: function(e){
         var hashtag = $(e.target).data('category');
         vent.trigger('navigate:search:hashtag', "ucla", null, hashtag);
      }
   });   
   
   var BaseHeaderView = Marionette.CompositeView.extend({
      childView: CategoryItemPageView,
      childViewContainer: ".dropdown-categories",
      ui:{
         searchBox: "#search-box",
         navCategories: '#nav-categories',
         navSearch:'#nav-search',
         searchForm: '#nav-search-form'
      },
      initialize: function(){
         this.onSubmitClick = _.debounce(this.onSubmitClick, 500, true);  
         this.navCategoryTimer = null;
      },
      registerSearch: function(){
         //hide the navbar 
         var that = this;
         $('html').on('click.headerSearch', function(event) {
            if(!$(event.target).closest('#search-box').length) {
               if($('#search-box').is(":visible")) {
                  that.hideNavSearch();
               }
            }        
         });
      },
      events:{
         "click #home-link"      : 'onHomeClick',
         'click #submit-btn'     : 'onSubmitClick',
         'keyup @ui.searchBox'	: 'onSearchKeyUp',
         'click [data-category="all"]': 'onAllSearch',
         //'mouseover @ui.navCategories'   : 'overCategory',
         //'mouseout @ui.navCategories'    : 'outCategory',
         'click @ui.navSearch' : 'onNavSearchClick'
      },
      onHomeClick: function(){
         vent.trigger("navigate:home");
      },
      onAllSearch:function(){
         vent.trigger('navigate:search:home', 'ucla', null);
      },
      onSearchKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault(); 
         if(k == ENTER_KEY){
            this.onSubmitClick();
         }
      },
      onSubmitClick: function(){
         var search_name = this.ui.searchBox.val().trim();
         vent.trigger('navigate:search:name', "ucla", null, search_name);
      },
      /*overCategory: function(){
         if(this.navCategoryTimer){
            clearTimeout(this.navCategoryTimer);
         }
         this.ui.navCategories.addClass('open');
      },
      outCategory: function(){
         var that = this;
         this.navCategoryTimer = setTimeout(function() {
            that.ui.navCategories.removeClass('open');
         }, 200);
      },*/
      hideNavSearch: function(){
         this.ui.searchBox.parent().removeClass('open');
         var that = this;
         _.delay(function(){            
            that.ui.navSearch.removeClass('hide');
            that.ui.searchForm.addClass('hide');
         },450);
      },
      onNavSearchClick: function(event){
         this.ui.navSearch.addClass('hide');
         this.ui.searchForm.removeClass('hide');
         this.ui.searchBox.focus().parent().addClass('open');
         event.stopPropagation();
         event.preventDefault(); 
      },
      onDestroy: function(){
         $('html').off('click.headerSearch');
      }
   });
      
   return BaseHeaderView;
});
