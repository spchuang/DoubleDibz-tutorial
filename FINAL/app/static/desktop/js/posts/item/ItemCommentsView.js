define([
   'jquery',
   'underscore',
   'marionette',
   'vent',
   'reqres',
   'posts/CommentModel',
   'text!posts/item/tpl-item-comment.html',
   'jquery.textcomplete',
   'jquery.slimscroll',
   'jQuery-linkify'
],
function ($, _, Marionette, vent, reqres, CommentCollection, CommentTpl) {
   "use strict";
   
   var state_is_tagging = false;
   var EDIT_HELPER_MSG = 'Press ESC to cancel. @ to tag friends';
   var COMMENT_INPUT_PREFIX = '#edit-form-';
   var COMMENT_VIEW_PREFIX = '#comment-';

   var EditCommentsForm = new Backbone.Form({
       schema: {
         comment: { type: 'TextArea', validators: ['required'], title: ''}
       },
       idPrefix: 'input-'
   });
   
   var PostCommentsForm = new Backbone.Form({
       schema: {
         comment: { type: 'TextArea', validators: ['required'], title: '', editorAttrs:{placeholder: 'Write a comment...'}}
       },
       idPrefix: 'input-'
   });
   
   // Tagging dropdown setup
   var parseTagging = function(comment, friends){
      var that = this;
      var names = _.map(comment.match(/@(\w+)( \w+)*/g), function(name){
         return name.slice(1);
      });
      names = _.intersection(names, _.keys(friends)); 
      var ids = _.map(names, function(name){
         return friends[name]["id"];
      });
      return ids.join();     
   };
   
   var setupTagging = function(input, friends){
      var that = this;
      input.textcomplete([
          { 
              mentions: _.keys(friends),
              match: /@(\w*)( \w+)*$/,
              search: function (term, callback) {
                  callback($.map(this.mentions, function (mention) {
                     var regexp = new RegExp(term, 'i');
                     return term.length != 0 && regexp.test(mention) ? mention : null;
                  }));
              },
              template: function(mention){
                  return '<img src="' + friends[mention]["picture"] + '"></img><span>'+ mention+'</span>';
              },
              index: 1,
              replace: function (mention) {
                  return '@' + mention + '  ';
              }
          }],{ 
            maxCount: 5,
            className: 'dropdown-textcomplete-tagging',
            debounce: 50
          }).on({
              'textComplete:show': function (e) {
                  state_is_tagging = true;
              },
              'textComplete:hide': function (e) {
                  state_is_tagging = false;
              }            
          });   
   };
   
   // Comment Item View
   var IndividualCommentView = Marionette.ItemView.extend({
      template: CommentTpl,
      tagName: 'li',
      ui:{
         timeago: '.timeago',
         editForm: '.edit-form',
         content: ".comment-content"
      },
      events:{
         'click .delete' : 'onClickDelete',
         'click .edit'   : 'onClickEdit',
         'keyup @ui.editForm': 'onEditKeyUp',
         'click .comment-username': 'onCommentUserClick'
      },
      initialize: function(options){
         var that = this;
         reqres.request('currentUser').getFBFriends(function(friends){
            that.friends = friends;
         });
      },
      onRender: function(){
         this.form = EditCommentsForm.render();
         this.ui.timeago.timeago(); 
         this.ui.content.linkify();
      },
      onClickDelete: function(){
         var r = confirm("Are you sure you want to delete this comment?");
         if (r == false) return;
         this.model.destroy();
      },
      onClickEdit: function(e){
         this.trigger('close:last:edit');
         var comment_id = e.target.id.replace('edit-','');
         this.goEditMode(comment_id);
         this.trigger('set:current:edit', this.model);
         setupTagging(this.$(COMMENT_INPUT_PREFIX+comment_id+" > #input-comment"), this.friends);
      },
      
      onEditKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
             ENTER_KEY = 13,
             ESC_KEY = 27;
         
         evt.preventDefault(); 
         if(k === ENTER_KEY && !state_is_tagging){
            this.updateComment();
         }else if(k === ESC_KEY){
            this.showComment();
            this.$(COMMENT_INPUT_PREFIX+this.id+" > #input-comment").textcomplete('destroy');
         }
      },
      updateComment: function(){
         if(this.form.validate()){
            return;
         }
         var that = this;
         var data = this.form.getValue();
         this.model.set(data);
         this.showComment();
         //Save model to database and pass in facebook tagging
         var fb_ids = parseTagging(data.comment, this.friends);
         
         //trim endlines
         data.comment = data.comment.trim();
         
         this.model.save(_.extend(data, {fb_ids: fb_ids}), {
            success : function(model, res){ 
            
            },error: function(collection, res, options){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      goEditMode: function(id){
         this.$(COMMENT_VIEW_PREFIX+id).hide();
         this.$(COMMENT_INPUT_PREFIX+id).append(this.form.fields.comment.editor.el)
                                 .append("<p id=\"edit-helper-msg\">"+EDIT_HELPER_MSG+"</p>")
                                 .find('textarea').focus().val(this.model.get('comment'));
      
      },
      showComment: function(){
         this.$(COMMENT_INPUT_PREFIX+this.model.id).empty();
         this.ui.content.text(this.model.get("comment"));
         //linkify content
         this.ui.content.linkify();

         this.$(COMMENT_VIEW_PREFIX+this.model.id).show();
      },
      onCommentUserClick: function() {
         vent.trigger("close:modal");
         vent.trigger('navigate:posts:user', this.model.get('user').user_name);
      },
      onBeforeDestroy: function(){
         this.ui.timeago.timeago('dispose');
      }
   });
   
   // Comment Composite View
   var ItemCommentsView = Marionette.CompositeView.extend({
      template: '<div class="comment-list-wrap">\
               <ul class="comment-list"></ul>\
               </div>\
               <div id="comment-form"></div>',
      childView: IndividualCommentView,
      childViewContainer: ".comment-list",      
      childEvents: {
         'close:last:edit': function(){
            if(this.current_edit){
               $(COMMENT_INPUT_PREFIX+this.current_edit.id).empty();
               $(COMMENT_VIEW_PREFIX+this.current_edit.id).show();
               this.current_edit = null;
            }
         },
         'set:current:edit': function(options){
            this.current_edit = options.model;
         }
      },
      ui:{
         commentForm: '#comment-form',
      },
      events:{
         'keyup @ui.commentForm': 'onKeyUp'
      },
      initialize: function(options){
         this.in_circle = reqres.request('currentUser').isInCircle(this.model.get('joined_circles'));
         
         var that = this;
         reqres.request('currentUser').getFBFriends(function(friends){
            that.friends = friends;
            setupTagging(that.$("#comment-form > #input-comment"), that.friends);
         });
      },
      onShow: function(){
         // hide comments section if use is not logged in or not in the circle
         if(reqres.request('isLoggedIn') && this.in_circle){
            this.form = PostCommentsForm.render();
            this.ui.commentForm.append(this.form.fields.comment.editor.el)
                               .append("<small>Hint: @ to tag friends</small>");
         }else{
            this.ui.commentForm.append("<hr><small>*Please log in or be in the group to comment</small>"); 
            return;
         }
         /*this.$('.comment-list-wrap').slimScroll({
            height: '100%',
            distance: '2px'
         }).closest('.slimScrollDiv');*/
      },
      onKeyUp: function(evt){
         var k = evt.keyCode || evt.which,
            ENTER_KEY = 13,
            ESC_KEY = 27;
          
         if(k === ENTER_KEY && !state_is_tagging){
            evt.preventDefault();
            this.addComment();
            return false;
         }
      },
      addComment: function(){
         if(this.form.validate()){
            return;
         }
         
         //trim endlines
         var data = this.form.getValue().comment.trim();
         if(data === ''){
            return; 
         }
         //Clear comment form values
         this.form.setValue({comment:''});
         
         //Parse comment
         var fb_ids = parseTagging(data, this.friends);
         
         var that = this;
         this.collection.create(_.extend({comment: data}, {fb_ids: fb_ids}), {
            wait: true,
            success : function(model, res){        
               that.collection.add(model);
            },error: function(collection, res, options){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      onBeforeDestroy: function(){
      }
   });
   
   return ItemCommentsView;
});
