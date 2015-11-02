define([
   'jquery',
   'marionette',
   'vent',
   'reqres',
   'bootstrap-tour'
],
function ($, Marionette, vent, reqres) {
   "use strict";
   
   var BasicTour = Marionette.Object.extend({
      initialize: function(){
         this.setupTour();
      },
      start: function(){
         this.tour.start(); 
      },
      end: function(){
         this.tour.end(); 
      },
      setupTour: function(){
         var that = this;
         this.tour = new Tour({
            storage : false,
            keyboard: false,
            onShow: function (tour) {
               $('a').bind("click.myDisable", function(){
                   return false; 
               });
               $("button.close").prop("disabled", true);
            },
            onEnd: function (tour) {
               $('a').unbind("click.myDisable");
               $("button.close").prop("disabled", false);
            },
         });
         this.addSteps();
         this.tour.init();
      },
      addSteps: function(){
         var that = this;
         var skip = false;
         this.tour.addSteps([
            {
               title: "Welcome to DoubleDibz!",
               placement: "bottom",
               orphan: true,
               content: "This tour will guide you through some core features of DoubleDibz. You can start this tour again anytime by going to the help tab under MyAccount.",
            },
            {
               title: "Verify Email",
               element: ".alert",
               placement: "bottom",
               backdrop: true,
               content: "Before using DoubleDibz please first verify a valid ucla email. This is to ensure that you are actually a UCLA student.", 
               onPrev: function(){
                  vent.trigger("navigate:account:help");
               },
               onNext: function(){
                  vent.trigger('navigate:account:settings');
               }
            },
            {
               title: "My Account",
               element: "#settings-nav a#settings-link",
               placement: "bottom",
               content: "This is where you can change your account settings. You can update your personal information, look at posts you've created and access your bookmarks"
            },
            {
               title: "Creating, Messaging, Notifications",
               element: "#header-region .navbar-right",
               placement: "bottom",
               content: "The header contains shortcuts for easy navigation.<br /><span class=\"glyphicon glyphicon-plus\"></span>: You can request an item to buy or sell something of your own.<br /> <span class=\"glyphicon glyphicon-envelope\"></span>: You can message others for items that you are selling or buying.<br /><span class=\"glyphicon glyphicon-globe\"></span>: You will recieve notifications for any post you are interested in."
            },
            {
               title: "Searching",
               element: "#header-region #nav-search",
               placement: "bottom",
               content: "You can easily search for items that you need. All you need to do is type it into the search bar!",    
               onShow: function(){
                  $("#header-region #nav-search").trigger("click");
               }     
            },
            {
               title: "Categories",
               element: "#header-region #nav-categories",
               placement: "bottom",
               content: "Still unsure of what it is exactly that you need to buy? Don't worry, you can also easily search for items by category. We have everything including Hair & Beauty, Tickets, Electronics, etc...",
               onNext: function(){
                  vent.trigger('navigate:home');
               }                           
            },
            {
               title: "Search Results",
               orphan: true,
               content: "Here is what the general listings page looks like. Use filters to further specify what you are looking for. Pictures with Facebook icons on them indicate that they are \"Free and For Sale\" posts.",
               onPrev: function(){
                  vent.trigger('navigate:account:settings');
               }
            },
            {
               title: "Click a Post",
               orphan: true,
               content: "You can see more details of a post when you click on their picture. Try it out yourself!",
               onShown: function(){
                   //$(".popover.tour-tour .popover-navigation .btn-group .btn[data-role=next]").prop("disabled", true);
                   $('.post-list-item-img-wrap').unbind("click.myDisable");
                   $('.post-control').unbind("click.myDisable");
                   $('.post-list-item-img-wrap').on("click", function(){
                      that.tour.goTo(8);
                   });
               },
               onNext: function(){
                  vent.trigger("open:modal:first:post");
               }
            }, 
            {
               title: "Individual Post",
               orphan: true,
               content: "Use the left and right buttons to navigate between different posts. If the item was pulled from \"Free and For Sale\", you can contact the seller directly on Facebook. You can come back to any post later by bookmarking it. Items posted on DoubleDibz will also display the status of the post.",
            },
            {
               title: "End of Tutorial",
               orphan: true,
               content: "This concludes our basic tutorial. You can start this tour again anytime by going to the help tab under My Account Page.",
               onPrev: function(){
                  vent.trigger("open:modal:first:post");
               }
            }, 
         ]);
      }
   });
   
   return BasicTour;
});
