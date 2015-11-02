define([
   'backbone',
   'backbone-forms',
   'bbf-bootstrap3'
],
function (Backbone) {
   "use strict";
   
   var fullColumnTpl = Backbone.Form.fullColumnTpl,
       halfColumnTpl = Backbone.Form.halfColumnTpl;
   
   var MIN_USER_NAME_LEN = 4,
       MIN_PASSWORD_LEN = 6;
   
   var user_name_field = { title: "Username",type: 'Text', editorAttrs:{placeholder: 'Username'}, template: fullColumnTpl, 
         validators: [
            'required',
            function validateUserName(value, formValues){
               var err = {
                  type: 'user_name',
               };
               if(value.length < MIN_USER_NAME_LEN){
                  err.message = 'Username must be at least 4 characters long';
                  return err;
               }
               
               if( !/^[a-zA-Z0-9]*$/.test(value.trim())){
                  err.message = 'Username can only contain letters and numbers';
                  return err;
               }
            }
         
         ] };
         
   var pw_validators = [
            'required',
            function validatePassword(value, formValues){

               if(value.length < MIN_PASSWORD_LEN){
                  return {
                     type: 'password',
                     message : 'Password must be at least 6 characters long'
                  };
               }
            }
         ];
   
   var SignupForm = new Backbone.Form({
    schema: {
      first_name:    { title: "First name",type: 'Text', validators: ['required'], editorAttrs:{placeholder: 'First Name'}, template: halfColumnTpl },
      last_name:     { title: "Last name",type: 'Text', validators: ['required'],  editorAttrs:{placeholder: 'Last Name'}, template: halfColumnTpl },
      user_name:     user_name_field,
      email:         { type: 'Text', validators: ['required', 'email'], editorAttrs:{placeholder: 'Email Address'}, template: fullColumnTpl },
      password:      { type: 'Password', validators: pw_validators, editorAttrs:{placeholder: 'Password'}, template: fullColumnTpl },
      confirm:       { type: 'Password', editorAttrs:{placeholder: 'Confirm Password'} 
         , template: fullColumnTpl
         , validators: [
            'required',  { type: 'match', field: 'password', message: 'Passwords must match!' }
         ]}
    },
    idPrefix: 'input-'
   });
   
   var LoginForm = new Backbone.Form({
       schema: {
         login:      { title: "Username",type: 'Text', validators: ['required'], editorAttrs:{placeholder: 'Username'}, template: fullColumnTpl},
         password:   { title: "Password",type: 'Password', validators: pw_validators, editorAttrs:{placeholder: 'Password'}, template: fullColumnTpl }
       },
       idPrefix: 'input-'
   });
   
   var FBSignupForm = new Backbone.Form({
       schema: {
         user_name:    user_name_field,
       },
       idPrefix: 'input-'
   });
   
   var FBSignupFormWithEmail = new Backbone.Form({
       schema: {
         user_name:    user_name_field,
         email:      {type: 'Text', validators: ['required', 'email'], editorAttrs:{placeholder: 'Enter Email'}, template: fullColumnTpl}
       },
       idPrefix: 'input-'
   });
   
   var EmailForm = new Backbone.Form({
       schema: {
         email:      {type: 'Text', validators: ['required', 'email'], editorAttrs:{placeholder: 'Enter Email'}, template: fullColumnTpl}
       },
       idPrefix: 'input-'
   });
   
    
    var ResetPasswordForm = new Backbone.Form({
       schema: {
         old_password:      { title: "Password", type: 'Password', validators: ['required'], editorAttrs:{placeholder: 'Current Password'} , template: fullColumnTpl},
         password:  { type: 'Password', validators: pw_validators, title: 'New Password',  editorAttrs:{placeholder: 'New Password'} , template: fullColumnTpl},
         confirm:       { type: 'Password', editorAttrs:{placeholder: 'Re-enter Password'}, validators: [
                              'required',  { type: 'match', field: 'password', message: 'Passwords must match!' }
                         ], template: fullColumnTpl}
       },
       idPrefix: 'input-'
   });
   var NewPasswordForm = new Backbone.Form({
       schema: {
         password:  { type: 'Password', validators: pw_validators, title: 'New Password',  editorAttrs:{placeholder: 'Password'} , template: fullColumnTpl},
         confirm:       { type: 'Password', editorAttrs:{placeholder: 'Re-enter Password'}, validators: [
                              'required',  { type: 'match', field: 'password', message: 'Passwords must match!' }
                         ], template: fullColumnTpl}
       },
       idPrefix: 'input-'
   });
   
   return{
      'SignupForm' : SignupForm,
      'LoginForm'  : LoginForm,
      'FBSignupForm': FBSignupForm,
      'EmailForm'  : EmailForm,
      'NewPasswordForm': NewPasswordForm,
      'ResetPasswordForm': ResetPasswordForm,
      'FBSignupFormWithEmail': FBSignupFormWithEmail
   }
   
});
