define([
    'jquery',
    'underscore',
    'marionette', 
    'app',
    'vent',
    "text!general/tpl-home-page.html",
    'typed'
], function($, _, Marionette, App, vent, homePageTpl){
   "use strict";
   /*
   var extraHeader = '<li class="home-page-extra"><a class="page-scroll" href="#about">About</a></li>\
                      <li class="home-page-extra"><a class="page-scroll" href="#x-factor">Features</a></li>\
                      <li class="home-page-extra"><a class="page-scroll" href="#listings">Listing</a></li>';*/
                      
   var extraHeader = '<li class="home-page-extra"><a class="page-scroll" href="#about">About</a></li>\
                      <li class="home-page-extra"><a class="page-scroll" href="#x-factor">Features</a></li>';
   
   var HomePageView = Marionette.ItemView.extend({
      template: homePageTpl,
      initialize: function(){
         
         this.changeHeaderOn = 300;
      },
      ui: {
        search: '#home-search',
        searchWrap: '.search-wrap',
        typedWrap: '.search-typed',
        searchTyped: '.typed-element'
      },
      onRender: function(){
         $('body').addClass('on-home-page');
         _.bindAll(this, 'onScroll');
         $(window).on('scroll.homepage', _.throttle(this.onScroll, 100));
         
         //insert shit into navbar lol
         $('#navbar-right').prepend(extraHeader);
         $('body a.page-scroll').on('click', this.onScrollClick);
         
         
         //listen to resize
         $(window).on('resize.homepage', _.throttle(this.resizeHeader,500));
      },
      onShow:function(){
         this.resizeHeader();
         this.ui.searchTyped.typed({
            strings: ["Search, buy, repeat."],
            typeSpeed: 200
         });
      },
      resizeHeader: function(){
         $('header').css('height', $(window).height()+ 'px'); 
      },
      events:{
         'focus @ui.search': 'onSearchFocus',
         'blur  @ui.search': 'onSearchBlur',
         'click @ui.typedWrap' : 'onTypedClick',
         'click #signup-btn'   : 'onSignupClick',
         'click #tell-more'    : 'onTellMoreClick',
         'keyup @ui.search'	 : 'onSearchKeyUp',
         'click .search-icon'  : 'onSubmitClick'
      },
      onTypedClick: function(){
         this.ui.typedWrap.remove();
         this.ui.search.focus(); 
      },
      
      onTellMoreClick: function(){
         $('html, body').animate({
            scrollTop: $("#about").offset().top
          }, 800, 'swing');
      },
      onSignupClick: function(){
         vent.trigger("navigate:signup");
      },
      onScroll: function(){
         var sy = window.pageYOffset || document.documentElement.scrollTop;
         if(sy >= this.changeHeaderOn){
            $('body').addClass('home-navbar-show');
         }else{
            $('body').removeClass('home-navbar-show');
         }
      },
      onScrollClick: function(){
         var $anchor = $(this);
          $('html, body').animate({
            scrollTop: $($anchor.attr('href')).offset().top
          }, 800, 'swing');
      },
      onSearchFocus: function(){
         this.ui.searchWrap.addClass('focus');
      },
      onSearchBlur: function(){
         this.ui.searchWrap.removeClass('focus');
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
         var search_name = this.ui.search.val().trim();
         vent.trigger('navigate:search:name', "ucla", null, search_name);
      },
      onBeforeDestroy:function(){
         $('body').removeClass('on-home-page home-navbar-show');
         $(window).off('scroll.homepage resize.homepage');
         $('.home-page-extra').remove();
      }

   });

   return HomePageView;
});
