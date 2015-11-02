define([
   'jquery',
   'marionette',
   'app',
   'vent',
   'reqres',
   "text!account/tpl-account-header.html",
   'jquery.fileupload',
   'jquery.iframe-transport',
],
function ($, Marionette, App, vent, reqres, AccountHeaderTpl) {
   "use strict";

   var AccountHeaderView = Marionette.ItemView.extend({
      template: AccountHeaderTpl,
      
      initialize: function(options){
         this.listenTo(this.model, 'change:picture', this.updatePicture);
         this.isLoading = false;
      },
      ui:{
         picUpload:    '.profile-img-wrap input[type=file]',
         profileImg:   '.profile-img-wrap img',
         publicProfileLink: '.public-profile-link'
      },
      events:{
         'click @ui.publicProfileLink'   :   'onPublicProfileClick',
      },
      updatePicture: function(){
         this.ui.profileImg.attr('src', this.model.get('picture'));
      },
      
      onRender: function(){
         this.renderFileUpload();
         this.$(".profile-img-wrap").attr('title', 'Change your picture').tooltip({
            placement: 'bottom'
         })
         this.ui.publicProfileLink.attr('title', 'View your public profile').tooltip({
            placement: 'bottom'
         })
      },
      renderFileUpload: function(){
         //render jquery upload
         this.upload = this.ui.picUpload.fileupload({
             dataType: 'json',
             url: reqres.request('api').account_picture,
             autoUpload: true,
             singleFileUploads: true
         });
 
         var that = this;
         this.upload.on('fileuploadadd', $.proxy(this.uploading, this));
         this.upload.on('fileuploadalways', $.proxy(this.reset, this));
         
         this.upload.on('fileuploaddone', function (e, data) {
            that.model.set(data.result.data);
         });
         
         this.upload.on('fileuploadfail', function (e, data) {
            vent.trigger("flash:alert", {type: 'error', msg: "Something is wrong with uploading. Please try again."});
         });
      },
      uploading: function(e, data){
         if(this.isLoading){
            return;
         }
         var fileType = data.files[0].name.split('.').pop(), allowdtypes = 'jpeg,jpg,png';
         if (allowdtypes.indexOf(fileType) < 0) {
             vent.trigger("flash:alert", {type: 'error', msg: "Image can only be of type JPG, JPEG, and or PNG"});
             return false;
         }
         this.isLoading = true;
      },
      reset: function(){
         this.isLoading = false;
      },
      onPublicProfileClick: function(){
         vent.trigger("navigate:posts:user", this.model.get("user_name"));
      }
   });
   return AccountHeaderView;
});
