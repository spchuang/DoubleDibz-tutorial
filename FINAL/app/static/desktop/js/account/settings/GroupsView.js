define([
   'marionette',
   'app',
   'vent',
   'reqres',
   "text!account/settings/tpl-groups-item.html",
   'backbone-forms',
   'bbf-bootstrap3',
],
function (Marionette, App, vent, reqres, GroupsItemTpl) {
   "use strict";
   
   var GroupsItemView = Marionette.ItemView.extend({
      template: GroupsItemTpl,
      tagName: 'li',
      initialize: function(options){
      },
      ui:{
         leaveBtn: '#leave-btn',
         joinBtn: '#join-btn'
      },
      events:{
         'click @ui.leaveBtn': 'onLeaveClick',
         'click @ui.joinBtn': 'onJoinClick',
         'click .group-link': 'onGroupClick'
      },
      onRender: function(){
         //HIDE BOTH BUTTONS FOR NOW
         this.ui.joinBtn.hide();
         this.ui.leaveBtn.hide();
         if(this.model.get('is_member')){
            this.ui.joinBtn.hide();
         }else{
            this.ui.leaveBtn.hide();
         }
      },
      onLeaveClick: function(){
         var that = this;
         this.model.leaveCircle({
            success: function (res) {
               vent.trigger("flash:alert", {type: 'success', msg: res});
               that.ui.leaveBtn.hide();
               that.ui.joinBtn.show();
            },
            error: function (res, options) {
               vent.trigger("flash:alert", {type: 'error', msg: res.message});
            }
         });
      },
      onJoinClick: function(){
         var that = this;
         this.model.joinCircle({
            success: function (res) {
               vent.trigger("flash:alert", {type: 'success', msg: res});
               that.ui.joinBtn.hide();
               that.ui.leaveBtn.show();
            },
            error: function (res, options) {
               vent.trigger("flash:alert", {type: 'error', msg: res.message});
            }
         });
      },
      onGroupClick: function(){
         vent.trigger("navigate:search", this.model.get('name'));
      }
   });   
   
   var EmptyGroupView = Marionette.ItemView.extend({
      template: "<p>Join the UCLA group by verifying @ucla.edu email!</p>"
      
   });
   
   var GroupsCompositeView = Marionette.CompositeView.extend({
      template: "<ul class='group-list-wrapper list-unstyled'></ul>",
      childView: GroupsItemView,
      childViewContainer: ".group-list-wrapper",
      emptyView: EmptyGroupView,
      initialize: function(options){
         
      },
      ui:{
         
      },
      events:{
         
      },
      onRender: function(){
      
      },
   });
   return GroupsCompositeView;
});
