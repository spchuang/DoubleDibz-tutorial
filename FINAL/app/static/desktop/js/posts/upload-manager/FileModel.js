define([
   'jquery',
   'underscore',
   'backbone',
   'marionette',
],
function ($, _,Backbone, Marionette) {
   "use strict";
   /*
    * Events: ['filestarted', 'filecanceled', 'fileprogress', 'filefailed']
    */
    
   var File = Backbone.Model.extend({
      
      default: {
         //sync stores the actual image representation from the server, will only be set after successful upload
         sync: null,
         data: null,
         processor: null
      },
      state: "pending",
      start: function ()
      {
         if (this.isPending()) {
            this.get('processor').submit();
            this.state = "running";
            
            // Dispatch event
            this.trigger('filestarted', this);
          }
      },
      cancel: function (){
         this.get('processor').abort();
         this.destroy();
         
         // Dispatch event
         this.state = "canceled";
         this.trigger('filecanceled', this);
      },
   
      progress: function (data){
         // Dispatch event
         this.trigger('fileprogress', this.get('processor').progress());
      },
   
      fail: function (error){
         // Dispatch event
         this.state = "error";
         this.cancel();
      },
      done: function (result){
         // Dispatch event
         this.set({sync: result.data});
         this.id = result.data.id;
         this.state = "done";
         //if this is forced to be primary, then be it
         if(this.get("force_primary") === 1){
            this.setPrimary(true);
         }
         
         this.trigger('filedone', result);
      },
      sync: function(method, model, options) {
         if (method === "delete"){
            options.url  = this.url + '/' + this.id;
         } 
   
         return Backbone.sync(method, model, options);
      },
      /*
       * Attribute states
       */
      isPending: function (){
         return this.getState() == "pending";
      },
   
      isRunning: function (){
         return this.getState() == "running";
      },
   
      isDone: function (){
         return this.getState() == "done";
      },
   
      isError: function (){
         return this.getState() == "error" || this.getState == "canceled";
      },
   
      getState: function (){
         return this.state;
      },
      isPrimary: function(){
         return this.get('sync') && this.get('sync').is_primary == 1;
      },
      setPrimary: function(isPrimary){
         var oldVal = this.isPrimary();
         if(isPrimary){
            this.get('sync').is_primary = 1;
         }else{
            this.get('sync').is_primary = 0;
         }
         
         if (oldVal !== this.isPrimary()){
            this.trigger('updatePrimary');
         }
      }
   });


         
   var FileCollection =  Backbone.Collection.extend({
      model: File,
      initialize: function(){
         this.on("add", this.onAdd);
         this.on("remove", this.onRemove);
      },
      setPrimary: function(model){
         var primaryImgs = _.filter(this.models, function(model){
            return model.isPrimary();
         });
         _.each(primaryImgs, function(model){
            model.setPrimary(false);
         })
         model.setPrimary(true);
      },
      onAdd: function(model){
         // if this is the first model and it doesn't have a 
         if(this.length === 1 && _.isUndefined(model.get("sync"))){
            model.set({force_primary: 1});
         }
      },
      onRemove: function(model){
         // set the primary to the first model
         if(model.isPrimary() && this.length >0){
            this.at(0).setPrimary(true);
         }
      }
   });
   
   return {
      model: File,
      collection: FileCollection
   }
   
});
