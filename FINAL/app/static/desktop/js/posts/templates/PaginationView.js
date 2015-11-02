define([
   'underscore',
   'handlebars',
   'marionette',
   'vent',
   "text!posts/templates/tpl-pagination.html",

],
function (_, Handlebars, Marionette, vent, PaginationTpl) {
   "use strict";

   var PaginationView = Marionette.ItemView.extend({
      template: PaginationTpl,
      tagName: 'div',
      ui: {
         pager:   '#pager-wrap',
         pagerItem:  '.pagination-item',
         pagerNext: '#pager-next',
         pagerPrev: '#pager-prev'
      },
      events:{
        'click @ui.pagerNext': 'onNextClick',
        'click @ui.pagerPrev': 'onPrevClick',
        'click @ui.pagerItem': 'onItemClick'
      },
      initialize: function(options){
         this.pager = options.pager;
         this.totalPages = Math.ceil(parseInt(this.pager.total)/parseInt(this.pager.per_page));
         
         this.pager_class ='pager-';
      },
      onRender: function(){
         //render the pages
         /*
            Logic:
               if only one page (or no result) hide pager.
               else 
               
               if more than 12 pages, there are 3 cases:
                  1. first 6
                  2. last 6
                  3. else
         */
         var PAGE_LIMIT = 6, PAGE_LIMIT_EXTRA = 2, PAGE_MID=3;
         if(this.pager.total <= this.pager.per_page || this.pager.page > this.totalPages){
            this.ui.pager.hide();
            return;
         }
         
         var totalPages = this.totalPages;
         
         //if total pages is more than 10, special logic here
         if(totalPages > 12){
            //There are 3 cases here 
            if(this.pager.page <= PAGE_LIMIT){
               //first 6
               this.renderPagerItems(1, PAGE_LIMIT+PAGE_LIMIT_EXTRA);
               this.renderDisable(); 
               this.renderPagerItems(totalPages-PAGE_LIMIT_EXTRA+1, totalPages);
               
            }else if(this.pager.page > (totalPages - PAGE_LIMIT)){
               //last 6
               this.renderPagerItems(1, PAGE_LIMIT_EXTRA);
               this.renderDisable(); 
               this.renderPagerItems(totalPages-PAGE_LIMIT-PAGE_LIMIT_EXTRA+1, totalPages);
            }else{
               //middle
               this.renderPagerItems(1, PAGE_LIMIT_EXTRA);

               this.renderDisable(); 
               this.renderPagerItems(this.pager.page-PAGE_MID, this.pager.page+PAGE_MID);
               
               this.renderDisable(); 
               this.renderPagerItems(totalPages-PAGE_LIMIT_EXTRA+1, totalPages);            }
                  
         }else{
            this.renderPagerItems(1, totalPages);
         }
         
         //render disabled class
         if(this.pager.page == 1){
            this.ui.pagerPrev.addClass('disabled');
         }else if(this.pager.page == totalPages){
            this.ui.pagerNext.addClass('disabled');
         }
         
         //render current active
         this.$('#'+this.pager_class+this.pager.page).parent().addClass('active');
      },
      renderDisable: function(){
         this.ui.pagerNext.before('<li class="disabled"><a href="#">...</a></li>'); 
      },
      renderPagerItems: function(start, end){
         for(var i=start; i<= end; i++){
            this.ui.pagerNext.before('<li><a class="pagination-item" id="'+this.pager_class+i+'" href="#">'+i+'</a></li>');  
         } 
      },
      onPrevClick: function(){
         if(this.pager.page<=1) return;
         this.goToPage(this.pager.page-1);
      },
      onNextClick: function(){
         if(this.pager.page>=this.totalPages) return;
         this.goToPage(this.pager.page+1);
      },
      onItemClick: function(e){
         var page = e.target.id.replace(this.pager_class,'');
         this.goToPage(page);
      },
      goToPage: function(page){
         this.trigger('pagination:goto', page);
      }
   });
   
   return PaginationView;
});
