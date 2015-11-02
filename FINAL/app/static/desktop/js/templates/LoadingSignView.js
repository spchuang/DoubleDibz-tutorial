define([
   'marionette',
   'vent',
],
function (Marionette, vent) {

   var loadingView = Marionette.ItemView.extend({
      template: "<img src='/static/img/ajax-loader.gif' class='region-loader'>"
   });
   return loadingView;
});