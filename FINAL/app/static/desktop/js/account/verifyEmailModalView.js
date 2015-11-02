define([
   'marionette',
   'vent',
   'account/templates/AddEmailView',
],
function (Marionette, vent, AddEmailView) {
   "use strict";
   
   var verifyEmailTpl ='<div class="no-email-modal">\
                           <h2>Hello there!</h2>\
                           <p>Let\'s get you started on DoubleDibz.<br>\
                              But first, please add & verify a ucla.edu email to get started!</p>\
                           <div class="form-inline">\
                              <label>Email:</label>\
                              <span class="add-email-form-region"></span>\
                           </div><br> \
                           <a class="btn btn-md btn-primary add-email-btn">Submit</a> \
                        </div>';
   var VerifyEmailModalView = Marionette.LayoutView.extend({
      template: verifyEmailTpl,
      events: {
         'click @ui.addEmailBtn': 'onClick'
      },
      regions: {
         addEmailInput: '.add-email-form-region' 
      },
      ui: {
        addEmailBtn: '.add-email-btn' 
      },
      initialize: function(){
         this.input = new AddEmailView({preventOnEnter: true});
         var that = this;
         this.listenTo(this.input, "create:email:loading", function(){
            that.ui.addEmailBtn.button('loading');
         });
         this.listenTo(this.input, "create:email:finish", function(){
            that.ui.addEmailBtn.button('reset');
         });
         this.listenTo(this.input, "create:email:success", function(res){
            vent.trigger("close:modal");
            vent.trigger("flash:alert", {type: 'success', msg: res});
         });
      },
      onRender: function(){
         this.addEmailInput.show(this.input);
      },
      onClick: function(){
         this.input.addEmailFromInput();
      }
   });
   
   return VerifyEmailModalView;
});
