define([
   'jquery',
   'marionette',
   'app',
   'vent',
   'reqres',
   "text!account/settings/tpl-profile.html",
   'backbone-forms',
   'bbf-bootstrap3',
],
function ($, Marionette, App, vent, reqres, ProfileTpl) {
   "use strict";
   
   var ProfileForm = new Backbone.Form({
       schema: {
         first_name:    { type: 'Text', validators: ['required'], title: 'First Name', editorAttrs:{placeholder: 'First name'}},
         last_name:     { type: 'Text', validators: ['required'],  title: 'Last Name', editorAttrs:{placeholder: 'Last name'} },
         //sex_code:      { type: 'Select', title: 'Gender', options: {0:'Male', 1:'Female'} },
         //phone:         { type: 'Text', editorAttrs:{placeholder: 'XXX-XXX-XXXX'} },
         //bio:           { type: 'TextArea', title: 'Biography', editorAttrs:{placeholder: 'Self Description'} }
       },
       data: {
          sex_code: 1
       },
       idPrefix: 'input-'
   });
   
   var ProfileView = Marionette.ItemView.extend({
      template: ProfileTpl,
      initialize: function(options){
         this.form = ProfileForm.render();
      },
      ui:{
         settingsForm: '#settings-form',
      },
      events:{
         'click #save-btn'   :   'onSaveAttempt',
      },
      onRender: function(){
         
         this.ui.settingsForm.append(this.form.el);
         this.refreshData();
      },
      reset: function(){
         this.ui.picUploadBtn.removeClass('disabled').removeAttr('disabled').find('span').text('Change Picture');
      },
      
      onSaveAttempt: function(){
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors) return;
       
         vent.trigger('account:saveSettingsAttempt', this.form.getValue());
      },
      refreshData: function(){
         this.form.setValue({first_name: this.model.get('first_name')});
         this.form.setValue({last_name: this.model.get('last_name')});
         //this.form.setValue({sex_code: this.model.get('settings').sex_code});
         //this.form.setValue({phone: this.model.get('settings').phone});
         //this.form.setValue({bio: this.model.get('settings').bio});
      }
   });
   return ProfileView;
});
