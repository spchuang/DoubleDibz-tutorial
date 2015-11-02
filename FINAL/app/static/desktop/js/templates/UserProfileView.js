define([
   'marionette',
   'vent',
],
function (Marionette, vent) {
   "use strict";
   var userProfileTpl ='<span class="user-wrap"><a class="user-link" href="/u/{{user_name}}">\
                           <span class="user-name">\
                              {{user_name}}\
                           </span>\
                        </a></span>';
   var userProfileWithPictureTpl ='<span class="user-wrap-with-picture"><a class="user-link" href="/u/{{user_name}}">\
                           <img src="{{picture}}" class="img-circle user-pic">\
                           <span class="user-name">\
                              {{user_name}}\
                           </span>\
                        </a></span>';
   var UserProfileView = Marionette.ItemView.extend({
      getTemplate: function(){
         if(this.withPicture){
            return userProfileWithPictureTpl;
         }else{
            return userProfileTpl;
         }
      },
      tagName: 'span',
      events: {
         'click .user-link'  : 'onUserClick'
      },
      serializeData: function(){
        return this.user;
      },
      initialize: function(options){
          _.defaults(options, {withPicture : true, modalMode : false});
         this.user = options.user;
         this.modalMode = options.modalMode;
         this.withPicture = options.withPicture;
      },
      onRender: function(){
      },
      onUserClick: function(){
         if(is_canvas) return;

         if(this.modalMode){
            vent.trigger("close:modal");
         }
         vent.trigger('navigate:posts:user', this.user.user_name);
      },
   });
   
   return UserProfileView;
});
