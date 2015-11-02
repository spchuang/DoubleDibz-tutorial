define([
   'jquery',
   'underscore',
   'backbone',
   'marionette',
   'app',
   'vent',
   'reqres',
   "general/FlashMessageView",
   
],
function ($, _, Backbone, Marionette, App, vent, reqres, FlashMessageView) {
   "use strict";

   /*
    * Flash listens to 'flash:alert' and 'flash:close' events
    * @param alert (obj){type, msg}: type: 'success', 'danger' , 'info'
    * alert.msg could be an object or a string
    * @param timer (true/false) : if true, set a timer to remove the alert
    * @param type ('always', 'normal') if always, set to always region 
    * 
    */
   var FlashController = Marionette.Controller.extend({
      initialize: function(){
         this.flashTimer = null;
         this.timerTime = 4000;
         this.defaultMsg = {
            'success' : 'Good job!',
            'error'   : "Can't connect to the server. Please try again."
         };
      },
      // Parse alert message
      createFlashAlert: function(alert){
         if(!_.isObject(alert)) throw "Alert has to be an object";   
         if(alert.type != 'success' && alert.type != 'error' && alert.type!='info') throw "Alert type has to be 'success', 'error or info'";
         if(_.isUndefined(alert.msg)) alert.msg = "";
         if(!_.isObject(alert.msg) && !_.isString(alert.msg)) throw "Alert message has to be an object or a string";
         
         
         var a = {};
         a.type = alert.type;
         a.msg  = alert.msg;
         //if alert message is a string, try converting it to JSON (for error responseText)
         if (_.isString(alert.msg)){
            try {
               a.msg = $.parseJSON(alert.msg);
            }catch(err) {
               
               //if conversion fail, set message to the string or default messages
               a.msg = alert.msg || this.defaultMsg[alert.type];
            }
         }
         
         //now try to construct msg string from msg object (based on our API conventions)
         if(_.isObject(a.msg)){
            if(a.type === 'success' ){
               a.msg = (!_.isEmpty(a.msg)  && a.msg.message) || this.defaultMsg['success'];
            }else if(a.type === 'error'){
               //Special case: form validation: loop through error fields and append error msg
               if(a.msg.errors.type === 'Form validation error'){
                  var temp = a.msg.errors.type;
                  if(_.isObject(a.msg.errors.message)){
                     _.each(a.msg.errors.message, function(errors, key){
                        temp += "<br><b>" + key + "</b> : " + errors.join(" , ");
                     });  
                  }else{
                     temp += "<br>" + a.msg.errors.message;
                  }
                  
                  a.msg = temp;
               }else{
                  /*
                  a.msg = (!_.isEmpty(a.msg) && a.msg.errors.type + " : " + a.msg.errors.message ) || this.defaultMsg['error']; 
                  */
                  a.msg = (!_.isEmpty(a.msg) && a.msg.errors.message ) || this.defaultMsg['error']; 
               }
               
               
            }
         }     
         return a;
      },
      
      showFlashAlert: function(alert, opts){
         //if opts alert type is error and timer isn't set, set timer to false
         opts = opts || {};
         if(alert.type === 'error' && _.isUndefined(opts.timer)){
            opts.timer = false;
         }
         opts = _.extend({}, {timer: true, type: 'normal'}, opts) 
         
         App.alertRegion.show(new FlashMessageView(alert, opts));
         
         if(opts.timer){
            this.startTimer();
         }
      },
      startTimer: function(){
         //reset timer if timer exists
         if(this.flashTimer){
            clearTimeout(this.flashTimer);
         }
         var that = this;
         this.flashTimer = setTimeout(function() {
            that.closeFlashAlert();
         }, this.timerTime);
      },
      closeFlashAlert: function(noFade){
         if(!App.alertRegion.currentView) return;
         
         
         if(this.flashTimer){
            clearTimeout(this.flashTimer);
         }
         
         if(noFade){
            App.alertRegion.empty();
         }else{
            this.fadeHide();
         }
         
      },
      fadeHide: function(){
         //fadeout and slideup at the same time
         App.alertRegion.currentView.$el.animate(
            { height: 0, opacity: 0 }, 300, function(){
               App.alertRegion.empty();
         });
      }
      
      
   });
   
   var fc = new FlashController();
   
   //NOTE: each navigation will close a flash saved on the controller
   fc.listenTo(vent, 'all', function(evtName){
      if(evtName.indexOf('navigate:') > -1){
         this.closeFlashAlert(true);
      }  
   });
   
   fc.listenTo(vent, '_flash:alert', function(alert, opts){

      var c_alert = this.createFlashAlert(alert);
      this.showFlashAlert(c_alert, opts);  
      
      //scroll to top for every alert messages 
      $(document).scrollTop(0);      
   });
   
   fc.listenTo(vent, 'flash:close', function(){
      this.closeFlashAlert();
   });
   
   fc.listenTo(vent, 'flash:alert:on', function($el, alert, opts){
      //show the flash on a designated DOM
      var c_alert = this.createFlashAlert(alert);
      $el.html(new FlashMessageView(c_alert, opts).render().el);
   });
   
   fc.listenTo(vent, 'flash:always-alert', function(alert, opts){
      $("#app-content").addClass('on-always-alert');
      opts = opts || {};
      opts.type = 'always';
      vent.trigger("flash:alert:on", $("#always-alert-region"), alert, opts);
   })
   
   fc.listenTo(vent, 'flash:always-alert:close', function(){
      $("#app-content").removeClass('on-always-alert');
      $("#always-alert-region").empty();
   })

   return fc;
   
});
