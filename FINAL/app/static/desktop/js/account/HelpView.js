define([
   'marionette',
   'app',
   'vent',
   'reqres',
   'tour/BasicTour',
   "text!account/tpl-help-page.html"
],
function (Marionette, App, vent, reqres, BasicTour, HelpTpl) {
   "use strict";
   
   var HelpView = Marionette.ItemView.extend({
      template: HelpTpl,
      events:{
         'click @ui.signupTut'   :   'onClickSignupTut'
      },
      ui:{
         signupTut: '#signup-tutorial'
      },
      initialize: function(){
      },
      onRender: function(){
      
      },
      onClickSignupTut: function(){
         this.tour = new BasicTour();
         this.tour.start();
      }
      
   });
   return HelpView;
});
