
/*
* A persistent model to manage login session state. It
* includes methods for authentication: login/signup/logout. 
* Objects whoose states are dependent with user login can subscribe
* to changes in the session model.
* 
*/

define([
    'underscore',
    'reqres',
    'auth/UserModel',
    'vent'
], function(_, reqres, UserModel, vent){
   'use strict';

   var SessionModel = Backbone.Model.extend({

      // Initialize with negative/empty defaults
      // These will be overriden after the initial checkAuth
      defaults: {
         logged_in: false,
         user_id: '',
         
      },
      
      initialize: function(){
         // Singleton user object
         // Access or listen on this throughout any module with reqres.request('currentUser')
         this.user = new UserModel({ });
      },
        
      // Fxn to update user attributes after recieving API response
      updateSessionUser: function( userData ){
     
         this.user.set( _.pick( userData, _.keys(this.user.defaults) ) );
         this.set({ user_id: userData.id, logged_in: true });
         
      },
      clearSessionUser: function(){
         this.set({ user_id: ''.id, logged_in: false });
      },
      
      isLoggedIn: function(){
         return this.get('logged_in'); 
      },
      
      getCurrentUser: function(){
         return this.user;
      },

      //Check for session from API       
      checkAuth: function(callback, args) {
         var opts = { url: reqres.request('api').verify_auth , method: 'GET'};
         callback = this.extendCallback(callback, {
            success: function(res){
               this.updateSessionUser( res.data );
            },error: function(res){
               this.clearSessionUser();
            }
         },this);
         this.ajax(null, opts, callback);
      },
      
      login: function(data, type, callback){ 
         //if it's facebook, login with a different url
         var opts;
         if(type === 'fb'){
            opts = { url: reqres.request('api').auth+'/fb_login', method: 'POST'};
         }else{
            opts = { url: reqres.request('api').auth+'/login', method: 'POST'};
         }
         
         callback = this.extendCallback(callback, {
            success: function(res){
               this.updateSessionUser( res.data);
            }
         },this);
         this.ajax(data, opts, callback);
      },
      
      logout: function(data, callback){
         var opts = { url: reqres.request('api').auth+'/logout', method: 'POST'};
         callback = this.extendCallback(callback, {
            success: function(res){
               this.clearSessionUser();
            }
         },this);
         this.ajax(data, opts, callback);
      },
      
      signup: function(data, type, callback){
         var opts;
         if(type === 'fb'){
            opts = { url: reqres.request('api').auth+'/fb_signup' , method: 'POST'};
         }else{
            opts = { url: reqres.request('api').auth+'/signup' , method: 'POST'};
         }
         this.ajax(data, opts , callback);
      },
      
      check_fb_id: function(data, callback){
         var opts = { url: reqres.request('api').auth+'/check_fb_id' , method: 'POST', async: false};
         this.ajax(data, opts , callback);
      },
      check_email: function(data, callback){
         var opts = { url: reqres.request('api').auth+'/check_email' , method: 'POST', async: false};
         this.ajax(data, opts , callback);
      },    
      
      getSettings: function(callback){
         var opts = { url: reqres.request('api').settings, method: 'GET'};
         callback = this.extendCallback(callback, {
            success: function(res){
               this.updateSessionUser( res.data );
            }
         },this);
         return this.ajax(null, opts, callback);
         
      },
      //Update current user's settings
      updateSettings: function(data, callback){
         var opts = {url: reqres.request('api').settings, method: 'PUT'};
         callback = this.extendCallback(callback, {
            success: function(res){
               this.updateSessionUser(res.data);
            }
         },this);
         this.ajax(data, opts , callback);
      },
       //Update current user's password
      updatePassword: function(data, callback){
         var opts = {url: reqres.request('api').password, method: 'PUT'};
         this.ajax(data, opts , callback);
      },
      
      updateFBLink: function(callback){
         var opts = { url: reqres.request('api').fb_link , method: 'PUT'};
         this.ajax({}, opts , callback);
      },
      
      //Email verification
      verifyEmail: function(params, data, callback){
         if(data == null){
            var opts = {url: reqres.request('api').verify_email+params, method: 'GET'};
            this.ajax(null, opts , callback);   
         }else{
            var opts = {url: reqres.request('api').verify_email+params, method: 'POST'};
            this.ajax(data, opts , callback);              
         }  
      },
      
      forgotPassword: function(data, callback){
         var opts = {url: reqres.request('api').forgot_password, method: 'POST'}; 
         this.ajax(data, opts , callback);
      },
      
      LoginRequired: function(controller, callback){
         var that = this;
         return function(){
            if(!that.isLoggedIn()){
               return vent.trigger('account:unauthorized');
            }
            callback.apply(controller, arguments);
         };
      },
      setLoginRequired: function(controller, methods){
         var that = this;
         _.each(methods, function(name){
            var original_func = controller[name];
            if(!_.isFunction(original_func)) throw "Function " + name +" does not exist";
            
            controller[name] = that.LoginRequired(controller, original_func);
         });
      }

   });
   
   
   vent.on("account:unauthorized", function(){
      //right now, just redirect to login page
      //TODO: add "next" to redirect after person signs in?
      if(!is_canvas){
         vent.trigger("navigate:login", true);
      }
   });
   
   var session = new SessionModel({});
   reqres.setHandler("session", function(){
      return session;
   });
   
   reqres.setHandler("currentUser", function(){
      return session.getCurrentUser();
   });
   
   reqres.setHandler("isLoggedIn", function(){
      return session.isLoggedIn();
   });
   
   //Only one copy!
   return session;
});
