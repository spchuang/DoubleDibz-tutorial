define([
   'underscore',
   'marionette',
   'app',
   'vent',
   'bbf-bootstrap3',
   "bootstrap-modal"
],
function (_, Marionette, App, vent) {
   'use strict';

      
   /*
      options should contain
      {
         'title': '',
         'okText': ''
      }
   */
   return function(view, options){ 
      options = options || {};
      var defaults = {
         title: null,
         okText: 'Ok',
         showFooter: false,
         dialogClass: null,
         onShow: null,
         animate: true,
         escape: true
      }
      var opts =  _.extend({}, defaults, options);
      /*
      Backbone.BootstrapModal.renderContent = function(content ){
         var $el = this.$el;
         
         if (content && content.$el) {
            this.options.content = content;
            content.render();
            $el.find('.modal-body').html(content.$el);
         }
      }*/
      
      var modal = new Backbone.BootstrapModal({
         animate: opts.animate,
         content: view,
         title: opts.title,
         okText: opts.okText,
         focusOk: false,
         showFooter: opts.showFooter,
         dialogClass: opts.dialogClass,
         escape: opts.escape
      }).open();
      
      modal.onShow = opts.onShow;
      
      modal.renderContent = function(content, options){
         var $el = this.$el;
         
         if (content && content.$el) {
            //close the old view
            this.options.content.destroy();
            this.options.content = content;
            content.render();
            $el.find('.modal-body-content').html(content.$el);
            
            //replace classname (ideally we want to swap other parameters as well)
            var oldClass = opts.dialogClass;
            opts.dialogClass = options.dialogClass;
            this.$el.find(".modal-dialog").removeClass(oldClass).addClass(opts.dialogClass);
            if(options.onShow) options.onShow(modal);
         }
      }
      
      modal.on('shown', function(){
         if(this.onShow){
            this.onShow(modal);
         }
      });
      
      modal.showAlert = function(alert, opts){ 
         var $el = this.$el.find('.modal-flash');
         vent.trigger('flash:alert:on', $el, alert, opts);         
      }
      
      /*
         beforeOkay: return false to prevent close
         afterOkay: triggered after okay
      */
      modal.on('ok', function(){
         if(options.beforeOkay){
            var okay = options.beforeOkay(modal.options.content);
            if(!okay){
               return modal.preventClose();
            }
         }
         if(options.afterOkay){
            options.afterOkay(modal.options.content);
         }
      });
           
      return modal;  
   }
   
      
});
