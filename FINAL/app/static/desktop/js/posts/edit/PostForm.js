define([
   'backbone',
   'posts/PostModel',
   'posts/templates/priceTemplate',
   'backbone-forms',
   'bbf-bootstrap3',
   
],
function (Backbone, PostCollection, priceTpl) {
   "use strict";
   var MAX_HASHTAGS = 6;
   var PostForm = Backbone.Form.extend({
       schema: {
         name:          { type: 'Text', validators: ['required'], editorAttrs:{placeholder: 'What are you selling?'}},
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
         price:         { type: 'Text', editorAttrs:{placeholder: 'XX.XX'}, template: priceTpl, validators: [
            'required',
            function checkPrice(value, formValues){
               var err = {
                  type: 'price',
                  message: 'Please put valid prices that is up to 2 decimals'
               }
               if( !/^(\d{1,8})?(.\d{1,2})?$/.test(value.trim())){
                  return err;
               }
            }
         
         ] },
         description:   { type: 'TextArea', validators: ['required'], 'editorAttrs':{rows:10, placeholder: 'Brief description of the item...'}}
       },
       idPrefix: 'input-'
   });
   return PostForm;
});
