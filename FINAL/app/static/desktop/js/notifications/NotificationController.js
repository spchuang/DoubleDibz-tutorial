define([
   'marionette',
   'vent',
   'reqres',
   'backbone.poller',
   "notifications/dropdown/NotiDropdownView",
   'notifications/NotiCollection',
   "tour/BasicTour"
],
function (Marionette, vent, reqres, Poller, NotiDropdownView, NotiCollection, BasicTour) {
   
   'use strict';
   //create universal inbox 
   var pollingOptions = {
      delay: 5000,
      delayed: false,
      continueOnError: true,
      backoff: false,
   }
   
   var NotificationController = Marionette.Controller.extend({
      initialize: function(){
         this.notifications = new NotiCollection();
         this.notiPoller = Poller.get(this.notifications, pollingOptions);;  

      },
      updateNotification: function(){
         //if the user changed state to logged in, then we fetch new notifcations. Otherwise, reset
         if(reqres.request('isLoggedIn')) { 
            //start the poller
            this.notiPoller.start();
         }else {
            this.notiPoller.stop();
            this.notifications.reset();
         }
      }
      
   });

   var nc = new NotificationController();
   var loginRequiredPages = [
      'showMessagesPage', 'checkInboxPresent' 
   ];

   
   nc.listenTo(vent, "app:start:auth:done", function(options){
      nc.updateNotification();
      //listen to change in session
      nc.listenTo(reqres.request('session'), "change:logged_in", function(session){
         nc.updateNotification();
      });
   });
   
   //TEMP FUNCTION HERE
   var WelcomeDialogView = Marionette.LayoutView.extend({
      template: "<div><h3>Hi there, {{user_name}}!</h3> \
                     <p>Thank you so much for joining DoubleDibz! We really want to create the best possible experience for buying and selling among UCLA students through this site and we hope you will enjoy using it. Go ahead and check out the listings page to browse for what you want or start selling your items now! Still confused of what todo? Don't worry! Click the button below and we will show you a short tutorial of our site.</p>\
                     <p>If you have any more questions or suggestions, don't hesitate to let us know by emailing support@doubledibz.com or click on the 'Feedback' button at the bottom.</p>\
                     <p>Have fun!</p>\
                     <a class='btn btn-md btn-primary tutorial-link'>Start tutorial</a>\
                </div>",
      events: {
         'click .tutorial-link' : 'onTutorialClick'
      },
      serializeData: function(){
         return {
            'user_name' : reqres.request('currentUser').get('user_name')
         }
      },
      onTutorialClick: function(){
         vent.trigger("close:modal");
         var tour = new BasicTour();
         tour.start();
      }
   });
   
   var showWelcomeDialog = function(){
      vent.trigger('open:modal', new WelcomeDialogView(), {
         dialogClass: '',
      });
   }
   
   var system_notification_click = function(model) {
      // if welcome message 
      if(model.get('object_id') === 0){
         showWelcomeDialog();
      }
   }
   
   nc.listenTo(vent, 'notifications:click', function(model){
      //decrement the count
      model.setToRead();
      
      var type = model.getType();
      if(type === 'post'){
         vent.trigger('navigate:posts:item', model.get('object_id'));
      }else if(type === 'chat'){
         vent.trigger('navigate:messages:post', 'selling', model.get('object_id'));
      }else if(type === 'system_notification'){
         system_notification_click(model);
      }
   });
   
   //update header if inbox count changes
   nc.listenTo( nc.notifications, 'change:total_unread_count', function(){
      vent.trigger('notifications:updateCount', nc.notifications.get('total_unread_count'));
   });
  
   
   reqres.setHandler('notifications:dropdown', function(){
      return new NotiDropdownView({
         notifications: nc.notifications
      }).render();
   });
   
   
   return nc;

});
