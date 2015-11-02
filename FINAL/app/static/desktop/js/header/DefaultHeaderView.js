define([
    'marionette', 
    'vent',
    'header/BaseView',
    "text!header/tpl-default-header.html",
], function(Marionette, vent, BaseView, DefaultHeaderTpl){
   'use strict';
   

   var DefaultHeaderView = BaseView.extend({
      template: DefaultHeaderTpl,

      events: _.extend({},BaseView.prototype.events,{
         "click #signup-link"    :  "onSignupClick",
         "click #login-link"     :  "onLoginClick",
      }),
      onSignupClick: function(){
         vent.trigger("navigate:signup");
      },
      onLoginClick: function(){
         vent.trigger("navigate:login");
      },
      onHomeClick: function(){
         
         vent.trigger("navigate:home");
      },
     
   });
      
   return DefaultHeaderView;
});
