define([
   'marionette',
   'vent',
   'reqres',
   'text!search/tpl-search-filter.html',
],
function (Marionette, vent, reqres, SearchFilterTpl) {
   "use strict";

   var SearchFilterView = Marionette.ItemView.extend({
      template: SearchFilterTpl,
      ui: {
         categorySelect: '.category-filter',
         searchBox: '.search-box-filter'
      },
      events: {
         'click .search-filter': 'onFilterChange',
         'change @ui.categorySelect': 'onCategoryChange',
         'keyup @ui.searchBox': 'onSearchBoxKeyUp',
         'click .search-btn': 'onSearch'
      },
      initialize: function(options){
         this.search = options.search;
      },
      onRender: function(){
         
         this.renderCategory();
         this.renderDynamic();
      },
      renderDynamic: function(){
         //render filters
         this.$(".search-filter").removeClass("active");
         
         this.$(".order-filter[data-value='"+this.search.args.order+"']").addClass('active');
         this.$(".from-filter[data-value='"+this.search.args.from+"']").addClass('active');
         this.$(".type-filter[data-value='"+this.search.args.type+"']").addClass('active');
         this.$(".source-filter[data-value='"+this.search.args.src+"']").addClass('active');
         
         // hide order filter if we're on buy request 
         if(this.search.args.type === 'buy') {
            this.$(".order-filter-wrap").addClass('hide');
         }else {
            this.$(".order-filter-wrap").removeClass('hide');
         }
         this.updateCategoryText();
         this.updateSearchBoxText();
      },
      renderCategory: function(){
         var that = this;
         var categories = reqres.request('categories');
         _.each(categories.toJSON(), function(c){
            that.ui.categorySelect.append("<option value='"+c.name+"'>"+c.showName+"</option");
         });
         
      },
      onCategoryChange: function(){
         this.search.args.hashtag = this.ui.categorySelect.val();
         if(this.search.args.hashtag === 'everything'){
            this.search.args.hashtag = null;
         }
         this.updateCategoryText();
      },
      updateSearchBoxText: function(){
         this.ui.searchBox.val(this.search.args.name);
      },
      updateCategoryText: function(){
         if(this.search.args.hashtag){
            this.ui.categorySelect.find('option[value="'+this.search.args.hashtag+'"]').prop('selected', true);
         }else{
            this.ui.categorySelect.find('option[value="everything"]').prop('selected', true);
         }
         this.$('.selected-text').text(this.$(".category-filter option:selected").text()); 
      },
      updateResultTotal: function(num){
         this.$(".search-result-num").removeClass("hide").find("span").text(num);
      },
      onFilterChange: function(evt){
         var target = $(evt.target);
         
         if(target.hasClass('active')){ 
            return; 
         }
         target.parent().children().removeClass('active');
         target.addClass("active");
         
         this.search.updateArgs(target.data('filter-type'), target.data('value'));
         this.onPagerGo(null);
      },
      onSearchBoxKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13;
         evt.preventDefault(); 
             
         if(k == ENTER_KEY){
            this.onSearch();
         }
      },
      onSearch: function(){
         this.search.args.name = this.ui.searchBox.val();
         this.onPagerGo(null);
      },
      onPagerGo: function(page){
         this.search.args.page = 1;
         vent.trigger('navigate:search', this.search.circle, this.search.args);
         $(document).scrollTop(0);   
      },
   });
   return SearchFilterView;
});
