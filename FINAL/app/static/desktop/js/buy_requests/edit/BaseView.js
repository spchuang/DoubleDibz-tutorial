define([
   'marionette',
   'vent',
   'buy_requests/BuyRequestModel',
   'buy_requests/edit/BuyRequestForm',
   "general/FlashMessageView",
   'bloodhound',
   'bootstrap-tagsinput',
   'typeahead',
   "posts/upload-manager/backbone.upload-manager"

],
function (Marionette, vent, BuyRequest, BuyRequestForm, FlashMessageView) {
   "use strict";
   
   var BaseView = Marionette.ItemView.extend({
      initializeBase: function(options){     
         this.categories = options.categories;
         this.tags          = null;
         this.cat           = {name: '', text: '', type: 'category'};
         this.hashtags      = null;
         this.form = new BuyRequestForm().render();
         this.form.fields.categories.editor.setOptions(this.categories.toOptions())  
         this.initializeBloodhound();
      },
      events: {
         'change #input-categories': 'updateCategory'
      },
      initializeBloodhound: function(){
         //TODO: will modify this to not store the whole list but for now its okay
         this.hashtags = new Bloodhound({
            datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            prefetch: {
               url: '/api/hashtags',
               ttl: 600000, //10 mins
               filter: function(res) {
                  return $.map(res.data, function(name) {
                     return { 
                        name: name,
                        type: 'hashtag'
                     }
                  });
               }
            }  
         });
         this.hashtags.initialize();
      },
      renderBase: function(){
         this.renderForm();
         
         this.cat.name = this.form.getValue('categories');
         this.renderTags();
      },
      renderForm: function(){
         this.ui.BuyRequestForm.append(this.form.el);
      },
      renderTags: function(){
         this.tags = $(this.el).find('input#input-hashtags');

         this.tags.tagsinput({
            trimValue: true,
            itemValue: 'name',
            itemText: function(item) {
               return '#'+item.name;
            },
            freeInput: true,
            tagClass: 'label label-primary',
            confirmKeys: [13, 32, 44], //space, enter, and comma,
            typeaheadjs: {
               name: 'hashtags',
               displayKey: 'name',
               source: this.hashtags.ttAdapter(),
               templates: {
                  suggestion: Handlebars.compile('<p>#{{name}}</p>')
               }
            }
         });
         
         //inject the category
         this.tags.tagsinput('add', this.cat);
         
         //HACK: workaround the problem with blur
         this.tagInput = this.tags.tagsinput('input');
         this.tagInput.on('blur', $.proxy(function(event) {
            this.tagInput.val('');
         }, this));
         
         //prevent removing the category from hashtag
         this.tags.on('beforeItemRemove', function(event){
            if(event.item.type && event.item.type == 'category') event.cancel = true;
         });
        
         //real time validate hashtag
         this.tags.on('itemAdded', $.proxy(function(){
            var error = this.form.fields.hashtags.validate();   
         },this));
         this.tags.on('itemRemoved', $.proxy(function(){
            var error = this.form.fields.hashtags.validate();   
         },this));
         
         // show border focus
         $(document.body).on('focus.tagsinput', '.bootstrap-tagsinput', function(){
            $(this).addClass('focus');
         }).on('blur.tagsinput', '.bootstrap-tagsinput', function () {
            $(this).removeClass('focus');
         });
      },
      updateCategory: function(evt){
         this.cat.name = this.form.getValue('categories');
         this.tags.tagsinput('refresh');
      },
      getFormValue: function(){
        return {
            name        : this.form.getValue('name'),
            hashtags    : this.getHashtags(),
            description : this.form.getValue('description')
         } 
      },
      getHashtags: function(){
         var h = _.map(this.tags.tagsinput('items'), function(val){
            return val.name
         });
         return h.join(',');
      },
      validate: function(){
         var errors = this.form.validate();
         this.form.on('change', function(form, editor) { 
            form.validate();
         });
         if(errors){  
            return true;
         }
         return false;
      },
      onBeforeDestroy: function(){
         $(document.body).off("focus.tagsinput blur.tagsinput");

      }
   });
   
   return BaseView;

});
