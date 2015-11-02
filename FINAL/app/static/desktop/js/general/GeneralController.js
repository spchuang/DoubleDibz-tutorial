define([
   'jquery',
   'underscore',
   'backbone',
   'marionette',
   'app',
   'vent',
   'reqres',
   'general/ModalView',
   'general/HomePageView',
    "bugs/BugPostModel",
    "bugs/ReportBugView",
   'text!general/tpl-home-page.html',
   'text!general/tpl-404-page.html',
   'text!general/tpl-footer.html',
   'text!general/tpl-terms-of-service-page.html',
   'text!general/tpl-about-us-page.html'
   
],
function ($, _, Backbone, Marionette, App, vent, reqres, ModalView, HomePageView, BugPostModel, ReportBugView, HomeTpl, NotFoundTpl, FooterTpl, TermsTpl, AboutUsTpl) {
   "use strict";
      
   
   var emptyView = Marionette.ItemView.extend({
   });

   var FooterView = Marionette.ItemView.extend({
      template:FooterTpl,
      events:{
         'click #about-us-link': function(){
            vent.trigger('navigate:about');
         },
         'click #support-link': function(){
            vent.trigger("flash:alert", {type: 'info', msg: "Support is coming soon!"},{timer: true});
         },
         'click #blog-link':  function(){
            vent.trigger("flash:alert", {type: 'info', msg: "Blog is coming soon!"},{timer: true});
         },
         'click #terms-link': function(){
            vent.trigger("navigate:terms");
         }
      }
   });
   
   
   
   var GeneralController = Marionette.Controller.extend({
      showHomePage: function(){
         //return vent.trigger('mainRegion:show', new HomePageView());


         if(!reqres.request('isLoggedIn')){
            //show landing page if user not logged in 
            return vent.trigger('mainRegion:show', new HomePageView());
         }
         vent.trigger('navigate:search:home','ucla');
         
      },
      showEmptyPage: function(){
         vent.trigger('mainRegion:close');
      },
      show404Page: function(){
         vent.trigger('mainRegion:show', new emptyView({template:NotFoundTpl} ));
      },
      showFooter: function(){
         vent.trigger('footerRegion:show', new FooterView());
      },
      showTermPage: function(){
         vent.trigger('domChange:title', reqres.request('page:name').terms);
         vent.trigger('mainRegion:show', new emptyView({template:TermsTpl}));
      },
      showAboutPage:function(){
         vent.trigger('domChange:title', reqres.request('page:name').about);
         vent.trigger('mainRegion:show', new emptyView({template:AboutUsTpl}));

      },
      openReportBugModal: function(){
         var that = this;
         vent.trigger('open:modal', new ReportBugView(), {
            title: 'Give Feedback!',
            okText: 'Send',
            showFooter: true,
            beforeOkay: function(content){
               return content.validate();
            },
            afterOkay: function(content){
               that.attemptReportBug(content.form.getValue());
            }
         });
      },
      
      attemptReportBug: function(data){
         var that = this;
         var bug_post = new BugPostModel();
         bug_post.save(data, {
            wait: true,
            success : function(model, res){         
               vent.trigger("_flash:alert", {type: 'success', msg: res});
            },error: function(collection, res, options){
               vent.trigger("_flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      },
      openInviteFriendsDialog: function(){
         //For devo debug only
         var url = 'http://www.doubledibz.com/'
         var FB = reqres.request('FB');
         //var url = reqres.request('domain');
         FB.ui({
           method: 'send',
           display: 'iframe',
           link: url,
         });
      }
      
   });
   
   
   var gc = new GeneralController();
   
   gc.listenTo(vent, "navigate:home", function(){
      gc.showHomePage();
      Backbone.history.navigate("");
   });
   
   gc.listenTo(vent, "navigate:emptyPage", function(){
      gc.showEmptyPage();
   });
   
   gc.listenTo(vent, "navigate:404Page", function(){
      gc.show404Page();
   });
   
   gc.listenTo(vent, "navigate:terms", function(){
      gc.showTermPage();
      Backbone.history.navigate("about/legal/terms");
   })
   
   gc.listenTo(vent, "navigate:about", function(){
      gc.showAboutPage();
      Backbone.history.navigate("about/us");
   })
   
   gc.listenTo(vent, "showFooter", function(){
      gc.showFooter();
   })
   gc.listenTo(vent, 'open:reportbug', function(){
      gc.openReportBugModal();
   });
   gc.listenTo(vent, 'open:inviteFriends', function() {
      gc.openInviteFriendsDialog();
   });
   
   gc.listenTo(vent, 'open:modal', function(view, options){
      if(gc.modal) {
         //replace modal content
         gc.modal.renderContent(view, options);
         
      } else{
         gc.modal = ModalView(view, options);
         gc.modal.$el.one('hidden.bs.modal', function (e) {
            //open the new one
            gc.modal.options.content.destroy();
            gc.modal.remove();
            gc.modal = null;   
         });
      }
   });
   
   gc.listenTo(vent, 'close:modal', function(){
      if(gc.modal) {
         gc.modal.$el.modal('hide');
      }
   });
   
   gc.listenTo(vent, 'flash:alert', function(alert, opts){
      if(gc.modal){
         gc.modal.showAlert(alert, opts);
      }else{
         vent.trigger('_flash:alert', alert, opts);
      }
   });
   
   //gurantee to fire in global ui
   gc.listenTo(vent, 'global:flash:alert', function(alert, opts){
      vent.trigger('_flash:alert', alert, opts);
   });
   
      
   return gc;
   
   
});
  
