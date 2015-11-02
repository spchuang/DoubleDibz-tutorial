define([
   'marionette',
   'vent',
   'reqres',
   "templates/TimeagoView",
   'messages/messageView/MessagesBoardView',
   "text!messages/postChats/tpl-post-chats-list.html"
],
function (Marionette, vent, reqres, TimeagoView, MessageBoardView, PostChatsListTpl) {

   var ChatItemView = Marionette.LayoutView.extend({
      template: '<td>{{contact_name}}{{#if is_unread}}<small>(unread)</small>{{/if}} </td>\
                 <td><span class="item-time"></span></td>',
      tagName: 'tr',
      className: 'chat-list-item',
      events:{
         'click': 'onClick'
      },
      regions:{
         itemTime: '.item-time'
      },
      initialize: function(){
         this.listenTo(this.model, 'change:read', this.render);
      },
      onRender: function(){
         this.itemTime.show(new TimeagoView({
            time: this.model.get('modified_at')
         }));
      },
      onClick: function(){
         vent.trigger('navigate:messages:chatList', this.model);
      },
   });
   
   var emptyView = Marionette.ItemView.extend({
      template: '<div style="padding:10px">No chats yet</div>'
   });

   var tplChatList = '<table class="table table-condensed table-hover"><thead><tr> \
          <th>Contact user</th> \
          <th>time</th> \
        </tr></thead><tbody></tbody></table>';
      
   var ChatListView = Marionette.CompositeView.extend({
      template: tplChatList,
      childViewContainer: 'tbody',
      childView: ChatItemView,
      emptyView: emptyView,
   });

   // This view is only for post owners to manage multiple contact users
   var PostChatsListView = Marionette.LayoutView.extend({
      template: '<div class="post-chats-list-region"></div>\
                 <div class="message-board-wrap">\
                     <a href="#" class="go-back-link">Go Back</a>\
                     <div class="message-board-region"></div> \
                  </div>',
      initialize: function(options){
         this.post = options.post;  
         this.listenTo(vent, 'navigate:messages:chatList', this.onChatClick);
         // if no post chats yet, see empty view
         if(!this.post){
            this.chatListView = new ChatListView();
         }else{
            this.chatListView = new ChatListView({collection: this.post.get('chats')});
         }
         
         this.messageView = new MessageBoardView();
      },
      events: {
         'click .go-back-link' : 'onBackClick' 
      },
      className: 'post-chat-list-wrap',
      regions: {
         content: '.post-chats-list-region',
         messageBoard: '.message-board-region'
      },
      onShow: function(){ 
         this.content.show(this.chatListView);
         this.messageBoard.show(this.messageView);
         
      },
      onChatClick: function(chat){
         // switch to message view, load chat
         this.$el.addClass('message-mode');
         this.messageView.updateChat(chat);
      },
      onBackClick: function(){
         // remvoe the message board
         this.$el.removeClass('message-mode');
      }
      
   });

   return PostChatsListView;
});