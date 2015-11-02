define([
   'backbone',
   'backbone-forms',
   'bbf-bootstrap3',
],
function (Backbone) {
   "use strict";
   var MAX_HASHTAGS = 6;
   var BuyRequestForm = Backbone.Form.extend({
       schema: {
         name:          { type: 'Text', validators: ['required'], editorAttrs:{placeholder: 'What are you looking for?'}},
         categories:    {type: 'Select', title: 'Category', validators: ['required'], options: []},
         hashtags:      {type: 'Text', title: 'Hashtags', validators: [
            'required',
            function checkMaxHashtags(value, formValues){
               var err = {
                  type: 'hashtags',
                  message: 'Please enter no more than 6 tags'
               }
               if(value.split(",").length > MAX_HASHTAGS){
                  return err;
               }
            },
            function checkValidHashtag(value, formValues){
               var err = {
                  type: 'hashtags',
                  message: 'Hashtags can only be underscore (_), uppercase or lowercase caracters.'
               }
               
               var invalidTag = _.find(value.split(","), function(val){
                  return !/^([a-zA-Z0-9_]+)$/.test(val.trim());
               });
               if(invalidTag){
                  return err;
               }
            }
         ] },
         description:   { type: 'TextArea', validators: ['required'], 'editorAttrs':{rows:10, placeholder: 'Brief description of item...'}}
       },
       idPrefix: 'input-'
   });
   return BuyRequestForm;
});
