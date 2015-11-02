define([
   'marionette',
   'vent',
],
function (Marionette, vent) {
   "use strict";
   var hashtagsTpl ='{{#each hashtags}}\
                        <a href="/ucla?hashtag={{this.name}}">\
                           <span class="hashtag-link" data-value="{{this.name}}">#{{this.name}}</span>\
                        </a>\
                    {{/each}}';
   var HashtagsView = Marionette.ItemView.extend({
      template: hashtagsTpl,
      events: {
         'click .hashtag-link': 'onHashtagClick',
      },
      serializeData: function(){
         return {
           hashtags: this.hashtags
         };
      },
      initialize: function(options){
         this.hashtags = options.hashtags;
         this.modalMode = options.modalMode || false;
      },
      onHashtagClick: function(evt){
         if(is_canvas) return;
         
         if(this.modalMode){
            vent.trigger("close:modal");
         }
         
         var hashtag = $(evt.target).data('value');
         vent.trigger('navigate:search:hashtag', "ucla", null, hashtag);
      },
   });
   
   return HashtagsView;
});
