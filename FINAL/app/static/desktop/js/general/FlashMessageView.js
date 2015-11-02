define([
   'jquery',
   'underscore',
   'backbone',
   'marionette',
   'app',
   'vent',
   "text!general/tpl-flash-msg.html",
   
],
function ($, _, Backbone, Marionette, App, vent, FlashMsgTpl) {
   "use strict";
   
   var FlashMessageView = Marionette.ItemView.extend({
      template: FlashMsgTpl, 
      initialize: function(alert, opts) {
         this.type = alert.type;
         //do conversion
         if(this.type === 'error') this.type = 'danger';
         this.msg  = alert.msg;
         
         this.opts = opts;
      },
      serializeData: function(){
         return {
            'type': this.type ,
            'msg' : this.msg
         }
      },
      events:{
         'click #close-flash-btn' : 'closeAlert'
      },
      closeAlert: function(){ 
         if(this.opts.type === 'always'){
            vent.trigger('flash:always-alert:close');
         }else{
            vent.trigger('flash:close');
         }
         
      }
   });
   
   return FlashMessageView;
   
});
