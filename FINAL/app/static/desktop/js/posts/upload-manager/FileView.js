define([
   'jquery',
   'underscore',
   'backbone',
   'marionette',
   "posts/upload-manager/FileModel",
   "text!posts/upload-manager/upload-file-view.html",
],
function ($, _,Backbone, Marionette, FileModel, UploadManagerFileTpl) {
   "use strict";
   var getHelpers = function () {
      return {
          displaySize: function (bytes) {
           var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
           if (bytes == 0) return '0 B';
           var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
           return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
       }
      }
   };
   
   var FileView =  Marionette.ItemView.extend({
      template: UploadManagerFileTpl,
      ui:{
        row: '.upload-manager-file',
        cancelBtn: '.btn-cancel',
        clearBtn:  '.btn-clear',
        setPrimaryBtn: '.btn-set-primary',
        progress:   'div.progress .progress-bar',
        progress_wrap: 'div.progress',
        size: 'span.size',
        message: 'span.message',
        name:     'span.name',
        img:    '.file-img'
      }, 
      events: {
         'click @ui.cancelBtn': function(){
            this.model.cancel();
         },
         'click @ui.clearBtn': function(){ 
            this.ui.clearBtn.button('loading');
            this.model.destroy({wait: true});
         },
         'click @ui.setPrimaryBtn': function(){
            this.model.collection.setPrimary(this.model);
         }
      },
      initialize: function (options) {
         this.listenTo(this.model, 'destroy', this.destroy);
         this.listenTo(this.model, 'fileprogress', this.updateProgress);
         this.listenTo(this.model, 'filefailed', this.hasFailed);
         this.listenTo(this.model, 'filedone', this.hasDone);
         this.listenTo(this.model, 'updatePrimary', this.updateIsPrimary);
      },
      onRender: function(){
        this.updateIsPrimary(); 
        this.ui.setPrimaryBtn.attr('title', "Set to primary").tooltip({
            placement: 'top',
            container: this.ui.setPrimaryBtn
         }); 
         this.ui.clearBtn.attr('title', "Remove this picture").tooltip({
            placement: 'top',
            container: this.ui.clearBtn
         }); 
      },
      updateIsPrimary: function(){
         if(this.model.isPrimary()){
            return this.ui.row.addClass('is-primary');
         }
         this.ui.row.removeClass('is-primary');
      },
      updateProgress: function (progress){
         var percent = parseInt(progress.loaded / progress.total * 100, 10);

         this.ui.progress.css('width', percent+'%').attr('aria-valuenow', percent)
            .parent().find('.progress-label')
            .html(getHelpers().displaySize(progress.loaded)+' of '+getHelpers().displaySize(progress.total));
      },

      /**
       * File upload is done.
       *
       */
      hasDone: function (result){
         //$('span.message', this.el).html('<i class="glyphicon glyphicon-ok"></i> Uploaded');
         this.ui.row.removeClass("uploading");
         this.ui.img.find('img').attr('src', this.model.get('sync').thumbnail);
         //$().add(this.ui.cancelBtn).add(this.ui.progress_wrap).add(this.ui.size).add(this.ui.name).addClass('hidden');
         //$().add(this.ui.message).add(this.ui.clearBtn).add(this.ui.img).removeClass('hidden');
      }
   });
   return FileView;
});
