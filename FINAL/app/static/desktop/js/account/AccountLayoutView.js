define([
   'marionette',
   'app',
   'reqres',
   'vent',
   'account/AccountHeaderView',
   "text!account/tpl-layout-page.html",
   "text!account/tpl-account-sidebar.html",
   'backbone-forms',
   'bbf-bootstrap3'
],
function (Marionette, App, reqres, vent, AccountHeaderView, LayoutTpl, SideBarTpl) {
   "use strict";
   var SideBarView = Marionette.ItemView.extend({
      template: SideBarTpl,
      initialize: function(){
         this.listenTo(vent, "account:selected", this.markSelected);
         
      },
     serializeData: function(){
       return {
          "is_canvas": is_canvas
       }
     },
      ui:{
         sidebar: '.settings-nav',
         sidebarItems: '.settings-nav >a'
      },
      events:{
         'click .settings-nav >a' :  'onSidebarClick'
      },
      onShow: function(){
         // show afix 
         this.$('.settings-side-wrap').affix({
           offset: {
             top: 70
           }
         }) 
      },
      onSidebarClick: function(e){
         if($(e.target).hasClass('active')){
            return;
         }
         var selected = e.target.id.replace('-link','');
         
         // messages is a special case
         if (selected === 'messages'){
            vent.trigger('navigate:messages');
         }
         
         //trigger correct page
         vent.trigger('navigate:account:'+selected);
      },
      markSelected: function(link){
         //mark item as selected
         this.ui.sidebarItems.removeClass("active");

         var link_id = '#'+link+'-link';
         
         this.ui.sidebar.find(link_id).addClass("active");
      }
      
   });
   
   var LayoutPageView = Marionette.LayoutView.extend({
      template: LayoutTpl,
      
      regions:{
         sideRegion: ".layout-side-region",
         headerRegion: ".layout-header-region",
         mainRegion:	".layout-main-region"
      },
      onRender: function(){
         this.sideRegion.show(new SideBarView({model: reqres.request('currentUser')}));
         this.headerRegion.show(new AccountHeaderView({model: reqres.request('currentUser')}));
      }
   });
   return LayoutPageView;
});
