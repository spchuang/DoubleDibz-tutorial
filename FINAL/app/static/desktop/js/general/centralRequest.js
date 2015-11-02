/*
 * Central request further decouples our app. It takes care of any data request that would be commonly used throughout.
 * for example, category, constants, helpers.
 */
define([
   'underscore',
   'reqres',
   'posts/CategoryModel',
   'facebook'   
], function (_, reqres, CategoryCollection, FB) {
   'use strict';

   var AppName = 'DoubleDibz';
   
   reqres.setHandler('page:name', function(){
      return {
         login       : 'Login to ' + AppName,
         signup      : 'Signup for ' + AppName,
         verify      : 'Verify Emails',
         forgotPass  : 'Forgot Password', 
         resetPass   : 'Reset Password', 
         account     : 'Account Settings',
         profile     : 'Profile Settings',
         email       : 'Email Settings',
         help        : 'Account Help',
         circle      : 'Group Settings',
         joinCircle  : 'Join Group',
         terms       : AppName + ' Terms of Service',
         about       : 'About ' +AppName,
         create      : 'Create a new post',
         myposts     : reqres.request('currentUser').get('user_name') + " on " + AppName,
         viewItem    : function(name){ return AppName + ' post'},
         editItem    : function(name){ return AppName + ' post' + ' - edit'},
         search      : function(search){ return 'search'},
         home        : 'Home'
      }
   });
   
   //return categories
   var categories = null;
   reqres.setHandler("categories", function(){
      if(!categories){
         //get from bootstrap
         if(typeof CATEGORIES !== 'undefined'){
            // cap all words
            categories = new CategoryCollection(CATEGORIES);
         }else{
            categories = new CategoryCollection();
            categories.fetch({reset: true, async: false});
         }
      }
      return categories;
   });
   
   var root = '/api';
   
   reqres.setHandler('apiRoot', function(){
      return root;
   });
   var root = '/api';
   //a single locatino for all the api url definition 
   reqres.setHandler('api', function(){
      
      return {
         emails         : root +'/account/emails',
         delete_email   : '/delete',
         update_email   : '/set_primary',
         resend_verify  : '/verify', 
         auth           : root +'/auth',
         verify_email   : root +'/auth/verify',
         fb_link        : root +'/account/fb_link',
         forgot_password: root +'/auth/forgot_password',
         reset_password : root +'/account/reset_password',
         password       : root +'/account/password',
         account_picture: root +'/account/picture',
         settings       : root +'/account/settings',
         verify_auth    : root +'/account/verify_auth',
         ucla_verified  : root +'/account/ucla_verified',
         bugposts       : root +'/bugposts',
         categories     : root +'/categories',
         chat           : root +'/chat',
         images         : root +'/images',
         posts          : root +'/posts',
         search         : root +'/search',
         user           : root +'/users',
         circles         : root +'/circles',
         buy_requests   : root +'/buy_requests',
         notification   : root +'/notifications',
         bookmarks      : root +'/bookmarks'
      };
   });
   
   var fb_appID = '687429857979311';
   reqres.setHandler('fb_appID', function(){
      return fb_appID;
   });
   
   var _FB_initialized = false;
   reqres.setHandler('FB', function(){
      //lazy load FB 
      FB = require('facebook');
      if(! _FB_initialized){
         FB.init({
            appId      : fb_appID,
            status     : true,
            cookie     : true,
            oauth      : true,
            xfbml      : false,
            version    : 'v2.0'
         });
         _FB_initialized = true;
      }
      
      return FB;
      
   });
   
   
   var domain = null;
   reqres.setHandler('domain', function(){
      if(!domain){
         //request
         $.ajax({
              url: root+'/auth/domain',
              async: false
            })
            .done(function(res){
               domain = 'http://'+res.data;
            });         
      }
      
      return domain;
      
   });
   reqres.setHandler('KEYS', function(){
      return {
         'ENTER' : 13
      }
   });
   
   reqres.setHandler('CONSTANTS', function(){
      return {
         RESET_PASSWORD: 1
         
      }
      
   });
});
