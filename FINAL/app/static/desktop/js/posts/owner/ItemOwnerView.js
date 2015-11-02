define([
   'backbone',
   'marionette',
   'vent',
   'reqres',
   'posts/item/PostItemPageView',
   "posts/edit/PostEditPageView",
   'messages/postChats/PostChatsView',
   'text!posts/owner/tpl-item-owner.html',
],
function (Backbone, Marionette, vent, reqres, PostItemPageView, PostEditPageView, PostChatsView, TplItemOwner){
   
   var ItemOwnerView = Marionette.LayoutView.extend({
      template: TplItemOwner,
      regions: {
        content: '.item-content-region' 
      },
      events:{
         'click .owner-tab ': 'onTabClick',
         'click #delete-btn': 'onDeleteClick',
         'click @ui.toggleStatusBtn': 'onToggleStatusClick',
      },
      ui:{
         toggleStatusBtn: '#toggle-status-btn',
      },
      className: 'post-item-owner', 
      initialize: function(options){
         options = options || {};
         this.tab = options.tab || 'view';
         this.listenTo(this.model,'change:status', this.renderStatus, this);
      },
      onShow: function(){
         this.renderContent();
         this.renderStatus(); 
      },
      renderContent: function(){
         // render tab
         this.$(".owner-tab").removeClass('active');
         this.$('[data-tab-option="'+this.tab+'"]').addClass('active');
         
         // render content
         if(this.tab === 'view'){
            this.content.show(new PostItemPageView({model: this.model}));
            Backbone.history.navigate('posts/'+this.model.id);
         }else if(this.tab === 'edit'){
            this.content.show(new PostEditPageView({
               model: this.model,
               categories: reqres.request('categories')
            }));
            Backbone.history.navigate('posts/'+this.model.id+'/edit');
         }else if(this.tab === 'chats'){
            var that = this;
            vent.trigger('messages:getPost', this.model.id, function(post){
               that.content.show(new PostChatsView({post: post}));
            });
            Backbone.history.navigate('posts/'+this.model.id+'/chats');
         }
      },
      renderStatus: function(){
         var status = this.model.get('status');
         //render btn
         if(status == 'active'){
            this.ui.toggleStatusBtn.text('Set to Sold');
         }else{
            this.ui.toggleStatusBtn.text('Set to Selling');
         }
      },
      updateTab: function(tab){
         if(this.tab === tab){
            return;
         }
         this.tab = tab;
         this.renderContent();
      },
      onTabClick: function(e){
         var tab = $(e.target).parent().data('tab-option');
         this.updateTab(tab);
      },
      onDeleteClick: function(){
         var that = this;
         vent.trigger('posts:deleteAttempt', this.model, function(){
            if(that.model.modalMode){
               vent.trigger("close:modal");
            }
         });
         
      },
      onToggleStatusClick: function(){
         console.log("TOGGLE");
         this.model.toggleStatus()
            .done(function(res){
               //vent.trigger("flash:alert", {type: 'success', msg: res});
            }).fail(function(res){
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            });
      },
   
   });
   return ItemOwnerView;
});