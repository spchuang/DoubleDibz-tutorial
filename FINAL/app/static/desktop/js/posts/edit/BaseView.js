define([
   'marionette',
   'vent',
   'posts/PostModel',
   'posts/edit/PostForm',
   "general/FlashMessageView",
   'bloodhound',
   'bootstrap-tagsinput',
   'typeahead',
   "posts/upload-manager/backbone.upload-manager"

],
function (Marionette, vent, Post, PostForm, FlashMessageView) {
   "use strict";
   
   var BaseView = Marionette.LayoutView.extend({
      regions: {
        pictureErrorRegion: '#post-picture-error', 
        pictureRegion: '#post-picture-wrap'
      },
      initializeBase: function(options){     
         this.categories = options.categories;
         this.uploadManager = null;
         this.tags          = null;
         this.cat           = {name: '', text: '', type: 'category'};
         this.hashtags      = null;
         this.form = new PostForm().render();
         
         // populate the category options
         this.form.fields.categories.editor.setOptions(this.categories.toOptions());
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
         this.renderUploadManager();
         
         this.cat.name = this.form.getValue('categories');
         this.renderTags();
      },
      renderForm: function(){
         this.ui.PostForm.append(this.form.el);
      },
      renderUploadManager: function(){
         //render Image uploade
         this.uploadManager = new Backbone.UploadManager({
            'uploadUrl': '/api/images',
            'autoUpload': true,
            'maxNumFiles': 6,
            'images': this.model.get('images') || []
         });
         var that=this;
         this.uploadManager.on('error', function(msg){
            if(msg === "REQUEST ENTITY TOO LARGE"){
               msg = "The picture is too big! Maximum size is 8MB";
            }else if(msg === "BAD REQUEST" || msg === "UNPROCESSABLE ENTITY"){
               //TODO: have better error message
               msg = "Something is wrong...try again?";
            }else if(msg==="abort"){
               return;
            }
            that.pictureErrorRegion.show(new FlashMessageView({type:'error', msg:msg}));
         });
      },
      onShow: function(){
         this.pictureRegion.show(this.uploadManager);
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
            price       : this.form.getValue('price').trim(),
            images      : this.uploadManager.getImageId().join(','),
            primary_image_id: this.uploadManager.getPrimaryImageId(),
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
         
         if(this.uploadManager.getImageId().length == 0){
            vent.trigger("flash:alert", {type: 'error', msg: "Must have at least 1 picture."});
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
