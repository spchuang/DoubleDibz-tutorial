define([
   'marionette',
   'app',
   'vent',
   'reqres',
   'account/templates/AddEmailView',
   "text!account/settings/tpl-emails.html",
   "text!account/settings/tpl-emails-item.html",
],
function (Marionette, App, vent, reqres, AddEmailView, EmailsTpl, EmailsItemTpl) {
   "use strict";

   var EmailsItemView = Marionette.ItemView.extend({
      template: EmailsItemTpl,
      tagName: 'tr',
      ui: {
         labels: '.email-labels',
         actions: '.email-actions'
      },
      constant:{
         primaryLabel:     '<span class="label label-success">Primary</span>',
         unverifiedLabel:  '<span class="label label-warning">Unverified</span>',
         verifiedLabel:    '<span class="label label-info">Verified</span>',
         setPrimaryBtn:    '<span id="set-primary-btn" class="btn btn-xs btn-default">Set to Primary</span>',
         setResendBtn:     '<span id="resend-verify-btn" class="btn btn-xs btn-default">Resend Verify</span>'
      },
      events:{
         'click #delete-btn': 'onDeleteClick',
         'click #set-primary-btn': 'onSetPrimaryClick',
         'click #resend-verify-btn': 'onResendVerifyClick'
      },
      initialize: function(){
         this.listenTo(this.model, 'change', this.render, this);
      },
      onRender: function(){
         
         this.updatePrimary();
         this.updateVerify();
      },
      updatePrimary: function(){
         if(this.model.is_primary()){
            this.ui.labels.append(this.constant.primaryLabel);
         }else{
            this.ui.actions.prepend(this.constant.setPrimaryBtn);
         }
      },
      updateVerify: function(){
         if(!this.model.is_verified()){
            this.ui.labels.append(this.constant.unverifiedLabel);
            this.ui.actions.prepend(this.constant.setResendBtn);
         }else{
            this.ui.labels.append(this.constant.verifiedLabel);
         }
      },
      onDeleteClick: function(){
         var r = confirm("Are you sure you want to remove this email? You may be removed from the group that you are authorized by with this email.");
         if (r == false) return;
         
         this.model.destroy({
            data: {},
            wait: true,
            success: function(model, res){
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(model, res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      onSetPrimaryClick: function(){
         var that=this;
         this.model.set_primary({
            success: function(model,res){
               that.model.collection.fetch({reset: true});
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(model, res){
               vent.trigger("flash:alert", {type: 'error', msg: res.message});
            }
         });
      },
      onResendVerifyClick: function(){
         this.model.resend_verification({
            success: function(res){
               vent.trigger("flash:alert", {type: 'success', msg: res});
            },error: function(res){
               vent.trigger("flash:alert", {type: 'error', msg: res.message});
            }
         });
      }
   });

   var EmailListView = Marionette.CollectionView.extend({
      childView: EmailsItemView,
      tagName: 'tbody'
   });
   
   var EmailsCompositeView = Marionette.LayoutView.extend({
      template: EmailsTpl,
      childView: EmailsItemView,
      childViewContainer: "#email-list-wrapper",
      ui:{
         addEmailBtn : '#add-email-btn',
         showAddEmailLink: '.show-add-email-link'
      },
      regions: {
         addEmailRegion: '.add-email-form-region',
         emailListRegion: '.email-list-region'
      },
      initialize: function(){
         this.addEmailView = new AddEmailView({collection: this.collection});
         var that = this;
         this.listenTo(this.addEmailView, "create:email:loading", function(){
            that.ui.addEmailBtn.button('loading');
         });
         this.listenTo(this.addEmailView, "create:email:finish", function(){
            that.ui.addEmailBtn.button('reset');
         });
         this.listenTo(this.addEmailView, "create:email:success", function(res){
            vent.trigger("flash:alert", {type: 'success', msg: res});
         });
      },
      onRender: function(){
         this.addEmailRegion.show(this.addEmailView);
         this.emailListRegion.show(new EmailListView({collection: this.collection}));
      },
      events:{
         'click @ui.addEmailBtn' : 'onAddEmailClick',
         'click @ui.showAddEmailLink': 'onShowAddEmail'
      },
      onShowAddEmail: function(){
         this.$(".add-email-wrap").removeClass('hide');
         this.ui.showAddEmailLink.addClass("hide");
      },
      onAddEmailClick: function(){
         this.addEmailView.addEmailFromInput();
      }
   });
   

   return EmailsCompositeView;
});
