define([
   'marionette',
   'vent',
],
function (Marionette, vent) {
   "use strict";
   
   var TimeagoView = Marionette.ItemView.extend({
      template: '<span class="timeago" title="{{time}}"></span>',
      serializeData: function(){
         return {
            time: this.time
         }
      },
      tagName: 'span',
      ui: {
        timeago: '.timeago' 
      },
      initialize: function(options){
         this.time = options.time
         this.showTooltip = options.showTooltip || false;
      },
      onRender: function(){
          //timeago
         this.ui.timeago.timeago(); 
         
         if(this.showTooltip){
            var time = this.ui.timeago.attr('title');
            time = (new Date(time)).toLocaleDateString();
            this.ui.timeago.attr('title', time).tooltip({
               placement: 'bottom'
            });      
         }
      },
      onBeforeDestroy: function(){
         this.ui.timeago.timeago('dispose');
      }
   });
   
   return TimeagoView;
});
