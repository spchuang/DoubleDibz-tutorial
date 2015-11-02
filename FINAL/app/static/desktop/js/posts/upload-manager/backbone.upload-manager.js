define([
   'jquery',
   'underscore',
   'backbone',
   'marionette',
   "posts/upload-manager/FileModel",
   "posts/upload-manager/FileView",
   "text!posts/upload-manager/upload-manager.html",
   
   'jquery.fileupload',
   'jquery.iframe-transport',
],
function ($, _,Backbone, Marionette, FileModel, FileView, UploadManagerMainTpl) {
   "use strict";
   var File = FileModel.model,
       FileCollection = FileModel.collection;
   
   var UploadManager = Marionette.ItemView.extend({
      template: UploadManagerMainTpl,
      defaults: {
         maxNumFiles: 6,
         uploadUrl: '/upload',
         autoUpload: false,
         dataType: 'json',
         images: []
      },
      ui:{
         input: 'input#fileupload' ,
         filelist: '.file-list',
         cancel_upload_btn: 'button#cancel-uploads-button',
         start_upload_btn: 'button#start-uploads-button',
      },
      getImageId: function(){
         return _.map(this.files.models, function(file, key){
            return file.id;
         });
      },
      getPrimaryImageId: function(){
         var model = _.find(this.files.models, function(model){
            return model.isPrimary();
         } );
         return model.id;
      },
      events: {
         //when we add files, pass the file to the inner fileupload wrapper
         'change @ui.input': function(e){
 
            //Check if we exceed maximum number of files
            var new_num = $(this.ui.input).get(0).files.length;
            
            //reset the value
            if(this.files.size() + new_num > this.options.maxNumFiles){
               this.trigger('error', "We can't have more than " + this.options.maxNumFiles + " files :( ");
               return;
            }
            
            this.uploadProcess.fileupload('add', {
               fileInput: $(this.ui.input)
            });
            
            this.ui.input.val("");
         },
         'click @ui.cancel_upload_btn' : function(){
            this.files.each(function(file){
               file.cancel();
            });
         },
         'click @ui.start_upload_btn': function(){
            this.files.each(function(file){
               file.start();
            }); 
         }
      },
      file_id: 0,
      initialize: function (options){
         // Merge options
         this.options = $.extend(this.defaults, options);
      
         // Create the file list
         this.files = new FileCollection();
      
         // Create the file-upload wrapper
         this.uploadProcess = $('<input id="fileupload" type="file" name="file" multiple="multiple">').fileupload({
             dataType: this.options.dataType,
             url: this.options.uploadUrl,
             formData: this.options.formData,
             autoUpload: this.options.autoUpload,
             singleFileUploads: true,
         });
         
         var that=this;
         
         //preload existing images
         $.each(this.options.images, function (index, image){
            var file = new File({
               data:{size:0}
            });
            file.done({
               data:image
            });
            file.url = that.options.uploadUrl;
            that.files.add(file);
         });
         
         // Add upload process events handlers
         this.bindProcessEvents();
      
         // Add local events handlers
         this.bindLocal();
      },
      
      onRender: function(){
         var that=this;
         
         this.files.each(function(model, index){
            that.renderFile(model);
         });
         this.update();
      },

      bindLocal: function (){
         var that = this;
         this.on('fileadd', function (file) {
            //Block create post button
            this.trigger("uploadManager:start");
                     
            // Add it to current list
            that.files.add(file);

            // Create the view
            that.renderFile(file);
         }).on('fileprogress', function (file, progress) {
             file.progress(progress);
         }).on('filefail', function (file, error) {
             that.trigger('error', error);
             file.fail(error);
         }).on('filedone', function (file, data) {
             file.done(data.result);
         });
      
         // When collection changes
         this.files.on('all', this.update, this);
      },
   
      renderFile: function (file){
         var file_view = new FileView($.extend(this.options, {model: file}));
         this.ui.filelist.append(file_view.render().el);
         
         //if sync exists, that means file is already uploaded
         if(file.isDone()){
            file_view.hasDone();
         }
      },

      //Update the view without full rendering.
      update: function ()
      {
         var with_files_elements = $().add(this.ui.cancel_upload_btn).add(this.ui.start_upload_btn);
         var without_files_elements = this.ui.filelist.find('.no-data', this.el);
         if (this.files.length > 0) {
            with_files_elements.removeClass('hidden');
            without_files_elements.addClass('hidden');
         } else {
            with_files_elements.addClass('hidden');
            without_files_elements.removeClass('hidden');
         }
      },
      checkDoneStatus: function(){
         //Unblock create post button
         var done = _.every(this.files.models, function(file){
            if(file.state != "pending" && file.state != "running")
               return true;
         });
         
         if(done){
            this.trigger("uploadManager:done");
         }
      },
      //Bind events on the upload processor. This is main interface to the fileupload library
      bindProcessEvents: function (){
         var that = this;
         this.uploadProcess.on('fileuploadadd', function (e, data) {
            // Create an array in which the file objects
            // will be stored.
            data.uploadManagerFiles = [];
            
            // A file is added, process for each file.
            // Note: every times, the data.files array length is 1 because
            //       of "singleFileUploads" option.

            //do some validation
            var file_data = data.files[0];
            var fileType = file_data.name.split('.').pop(), allowdtypes = 'jpeg,jpg,png';
            if (allowdtypes.indexOf(fileType) < 0) {
               that.trigger('error', "Only jpg, jpeg and png please.");
               return false;
            }
            
            // Create the file object
            file_data.id = that.file_id++;
            
            var file = new File({
               data: file_data,
               processor: data
            });
            //set model url (used for delete)
            file.url = that.options.uploadUrl;
            
            // Add file in data
            data.uploadManagerFiles.push(file);
            
            // Trigger event
            that.trigger('fileadd', file);

         }).on('fileuploadprogress', function (e, data) {
             $.each(data.uploadManagerFiles, function (index, file) {
                 that.trigger('fileprogress', file, data);
             });
         }).on('fileuploadfail', function (e, data) {
             $.each(data.uploadManagerFiles, function (index, file) {
                 var error = "Unknown error";
                 if (_.isString(data.errorThrown)) {
                     error = data.errorThrown;
                 } else if (_.isObject(data.errorThrown)) {
                     error = data.errorThrown.message;
                 } else if (data.result) {
                     if (data.result.error) {
                         error = data.result.error;
                     } else if (data.result.files && data.result.files[index] && data.result.files[index].error) {
                         error = data.result.files[index].error;
                     } else {
                         error = "Unknown remote error";
                     }
                 }
   
                 that.trigger('filefail', file, error);
             });
             
            that.checkDoneStatus();           
             
         }).on('fileuploaddone', function (e, data) {
            $.each(data.uploadManagerFiles, function (index, file) {
               that.trigger('filedone', file, data);
            });
            that.checkDoneStatus();
            
         });
      }
        
   });
    
   Backbone.UploadManager = UploadManager;
    
    
});
