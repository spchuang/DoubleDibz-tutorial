define([
   'jquery',
   'marionette',
   'vent',
   'reqres',
   'header/DefaultHeaderView',
   'header/LoggedInHeaderView',
   'header/CanvasHeaderView',
   
],
function ($, Marionette, vent, reqres, DefaultHeaderView, LoggedInHeaderView, CanvasHeaderView) {
   "use strict";
   
   var HeaderController = Marionette.Controller.extend({
      initialize: function(){
         this.header = null;
      },
      updateHeaderView: function() {
         if(is_canvas){
            this.showCanvasHeader();
         }else if(reqres.request('isLoggedIn')) {
            this.showLoggedinHeader(); 
         }else{
            this.showDefaultHeader();
         }
      },
      showDefaultHeader: function(){
         this.header = new DefaultHeaderView({collection: reqres.request('categories')});
         vent.trigger('headerRegion:show', this.header);
         vent.trigger("flash:always-alert:close");
         this.header.registerSearch();
      },
      showLoggedinHeader: function(){
         this.header = new LoggedInHeaderView({
            collection: reqres.request('categories'),
            user: reqres.request('currentUser')
         });
         
         var uclaTmpFlash = function(){
            
            vent.trigger("flash:always-alert",{
               type: 'info', 
               msg: "We temporarily added you in the <a href='#' data-navigate='settings:groups'>UCLA group</a>, please <a href='#' data-navigate='settings:emails'>add and verify a valid ucla.edu email</a> to remain in it!"
                  
            },{timer:false});    
         }
         
         console.log();
         if(!reqres.request('currentUser').get('ucla_temp')){
            //check if the person verified a valid ucla email
            reqres.request('currentUser').checkUCLAVerified({
               success: function(res){
                  if(!res.data){
                     //vent.trigger("close:modal");
                     vent.trigger("show:addVerifyEmail:modal");
                     //uclaTmpFlash();                    
                  }else{
                     vent.trigger("close:modal");
                  }
               },error: function(res){
                  console.log(res.responseText);
               }
            });
         }else{
            console.log("NOOOOO");
            //vent.trigger("close:modal");
            vent.trigger("show:addVerifyEmail:modal");
            //uclaTmpFlash();
         }
         //

         vent.trigger('headerRegion:show', this.header);
         this.header.registerSearch();
         $('.navbar-collapse').on('shown.bs.collapse', function() { 
            //console.log("THIS IS SHOWN"); 
         });
      },
      showCanvasHeader: function(){
         this.header = new CanvasHeaderView({
            user: reqres.request('currentUser')
         });
         vent.trigger('headerRegion:show', this.header);
         vent.trigger("flash:always-alert:close"); 
      }
   });
   
   var hc = new HeaderController();
      
   hc.listenTo(vent, "app:start:auth:done", function(options){
      hc.updateHeaderView();
      
      //listen to change in session and change headers
      hc.listenTo(reqres.request('session'), "change:logged_in", function(session){
         hc.updateHeaderView();
      });
   });
   
   hc.listenTo(vent, 'messages:updateCount', function(new_count){
      if(reqres.request('isLoggedIn')) {
         if(hc.header.updateInboxCount){
             hc.header.updateInboxCount(new_count);
         }
        
      }
   })
   
   hc.listenTo(vent, 'notifications:updateCount', function(new_count){
      if(reqres.request('isLoggedIn')) {
         if(hc.header.updateNotiCount){
            hc.header.updateNotiCount(new_count);
         }
         
      }
   })

   return HeaderController;
});


