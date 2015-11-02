# Frontend Documentation

## Flash Alert ('see GeneralController.py')

Events for flash alert. Pass in an `alert` object which has `type` and `msg` fields. `type` currently only accepts `success` or `error`. 

```javscript
//to show
vent.trigger("flash:alert", {type: 'success', msg: res});
   
//to close
vent.trigger("flash:close");
```

Alert message can only accept `object` or `string`. If the message is `string`, flash alert will first try to convet it to `JSON`. If the conversion fails, message will be set to the message string. If the message is an `object` or if the JSON parsing is successful, flash alert will construct the flash message based on the alert type. The construction should follow the convention API return structure. 

*If type is `success`, message will be `alert.msg.message`.

*If type is `error`, message ` alert.msg.errors.type + " : " + alert.msg.errors.message`

```javascript


   //example with AJAX calls. Upon success, pass the return JSON object, or if failed, pass in the responseText.
   Session.updatePassword(data,{
      success: function(res){
         vent.trigger("flash:alert", {type: 'success', msg: "You have succesfully changed your password!"});
      },error: function(res){
         vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
      }
   }); 
``` 
   
`Timer` option accepts `boolean` values. By setting it to `true`, the flash alert will only show up for a few seconds. The default for timer is `false`.

```javascript
vent.trigger("flash:alert", {type: 'success', msg: res}, {timer: true});
```

## Extended backbone model functions

#### Backbone.model.prototype.ajax (data, opts, callback)

This function performs the common ajax function and triggers the callback functions. By default, it sends json requests. It takes in 3 parameters: `data`, `opts`, and `callback`. `data` is the ajax data, `opts` is an option object in which `opts.url` defines request url and `opts.method` the request type (GET, POST, PUT, DELETE). `callback` is an object with three callback functions `success`, `error`, and `complete`. 

```javascript
///exmplae use
updatePassword: function(data, callback, args){
   var opts = {url: App.API+'/account/password', method: 'PUT'};
   this.ajax(data, opts , callback);
}
```

#### Backbone.model.prototype.extendCallback (callback, extension, ctx)

This function can extend the existing functions in the callback object. Both `callback` and `extension` could have three function fields: `success`, `error`, and `complete`. This function will wrap the existing callback functions in `callback` and extend them with the callback functions in `extension`. The third optional parameter `ctx` allows binding the extension function with a context object. 

```javascript
//example of extendcallback with ajax
updateSettings: function(data, callback){
   var opts = {url: App.API+'/account/settings', method: 'PUT'};
   callback = this.extendCallback(callback, {
      success: function(res){
         this.updateSessionUser(res.data);
      }
   },this);
   this.ajax(data, opts , callback);
},

```


DUMP:
<input id="test" type="file" name="file" multiple>
         t.on('fileuploadadd', function (e, data) {
            console.log(data);
         });
  
         
         var t = this.$('#test').fileupload({
            url: '/api/posts/images',
            dataType: 'json',
            done: function (e, data) {
               $.each(data.result.files, function (index, file) {
                  $('<p/>').text(file.name).appendTo(document.body);
               });
            }
         });
               