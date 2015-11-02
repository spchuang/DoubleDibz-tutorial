// defines a bunch of random settings for the app. May factor them out in the future
define([
  'jquery',
  'underscore',
  'backbone',
  'marionette', 
  'handlebars',
  'bbf-bootstrap3',
],
function ($, _, Backbone, Marionette, Handlebars) {
   var csrftoken = $('meta[name=csrf-token]').attr('content');
   //include csrf token to Backone in global scope
   
   //setup for all ajax calls
   $.ajaxSetup({
       beforeSend: function(xhr, settings) {
           if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type)) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
         }
       }
   });
   Backbone.$ = window.$;
   
   // Focus state for append/prepend inputs
   $(function() {
      $(document.body).on('focus', '.input-group .form-control', function(){
         $(this).closest('.input-group, .form-group').addClass('focus');
      }).on('blur', '.input-group .form-control', function () {
         $(this).closest('.input-group, .form-group').removeClass('focus');
      });
   });
   
   Handlebars.registerHelper('decimal', function(number){
      return number.toFixed(2);
   });
   
   Handlebars.registerHelper('if_eq', function(a, b, opts) {
      if(a == b){ // Or === depending on your needs
         return opts.fn(this);
      }else{
         return opts.inverse(this);
      }
   });
   
   Handlebars.registerHelper('toUpperCase', function(str) {
     return str.toUpperCase();
   });
   
   Handlebars.registerHelper('showPrice', function(number) {
      if(!_.isNaN(number) && number === 0){
         return 'FREE';
      }
      if(_.isNull(number)){
         return "";
      }
      
      //if there are decimal, show up to 2 digits
      if (number % 1 != 0){
         return '$' + number.toFixed(2);
      }
      return '$' + number.toFixed(0);
   });
      
   //set Handle bar as templating engine
   Backbone.Marionette.TemplateCache.prototype.compileTemplate = function(rawTemplate) {
      return Handlebars.compile(rawTemplate);
   };  
   
   //we don't need to retrieve the template from DOM (templateID itself is the template)
   Backbone.Marionette.TemplateCache.prototype.loadTemplate = function(templateId){
      return templateId;
   }
   
   //override backbone default parse funciton for model and collection
   Backbone.Model.prototype.parse = function (response, options) {
      if (options.collection) {
         return response;
      } else {
         return response.data;
      }
   };
   
   Backbone.Collection.prototype.parse = function(response){
      return response.data;
   }
   
   //fix on enter bug for backbone form
   Backbone.Form.template = _.template('\
    <form class="form-horizontal" role="form" onsubmit="return false">\
      <div data-fieldsets></div>\
      <% if (submitButton) { %>\
        <button type="submit" class="btn"><%= submitButton %></button>\
      <% } %>\
    </form>\
  ');
  
  //
  Backbone.Form.fullColumnTpl = _.template('\
    <div class="col-xs-12">\
      <div class="form-group field-<%= key %>">\
        <span data-editor></span>\
        <p class="help-block" data-error></p>\
        <p class="help-block"><%= help %></p>\
      </div>\
    </div>\
   ');
   
   Backbone.Form.halfColumnTpl = _.template('\
    <div class="col-xs-6  field-<%= key %>" >\
      <div class="form-group">\
        <span data-editor></span>\
        <p class="help-block" data-error></p>\
        <p class="help-block"><%= help %></p>\
      </div>\
    </div>\
   ');
  
   
   /*
    * HELPER FUNCTIONS FOR BACKBONE.MODEL
    * (Note: note sure if this is the best way to do this)
    */
   _.extend( Backbone.Model.prototype, {
      //Custom ajax fxn to make AJAX requests (refactor this out)
      ajax: function(data, opts, callback){
         if(_.isEmpty(data)) data = null;
         else data = JSON.stringify(data);
         
         if(! ('async' in opts)) opts.async = true;

         return $.ajax({
            url: opts.url,
            contentType: 'application/json',
            dataType: 'json',
            type: opts.method,
            async: opts.async,
            data:  data,
            success: function(res){
               if( callback && 'success' in callback ) callback.success(res);
            },
            error: function(mod, res){
               if(callback && 'error' in callback ) callback.error(mod);
            }
         }).complete(function(mod, res){
            if(callback && 'complete' in callback ) callback.complete(mod);
         });
      },
      
      /**
       * extend existing callback with extension object
       * @param {object}: callback {'success', 'error', 'complete'}
       * @param {object}: extension {'success', 'error', 'complete'}
       * @param {object}: [ctx] : ctx to invoke extension function
       */
       
      extendCallback: function(callback, extension, ctx){
         if(_.isEmpty(extension)) return callback;
         
         callback = _.clone(callback) || {};
         extension = _.clone(extension) || {};
         
         //extend callback for each option
         _.each( ['success', 'error', 'complete'], function(opt){
            if(extension && extension[opt]){
               callback[opt] = _.wrap(callback[opt], function(func, res){
                  _.bind(extension[opt], ctx)(res);
                  if(_.isFunction(func)) {
                     func(res);
                  }
               });
            }
         });
         return callback;

      }
   });
   
});
