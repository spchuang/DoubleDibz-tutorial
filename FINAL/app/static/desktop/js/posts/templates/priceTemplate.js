define([
   'underscore'
],
function (_) {
   return _.template('\
    <div class="form-group field-<%= key %>">\
      <label class="col-sm-2 control-label" for="<%= editorId %>"><%= title %></label>\
      <div class="col-sm-10">\
         <div class="input-group"><div class="input-group-addon">$</div>\
        <span data-editor></span></div>\
        <p class="help-block" data-error></p>\
        <p class="help-block"><%= help %></p>\
      </div>\
    </div>\
  ');
});
