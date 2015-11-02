define([
   'backbone',
   'marionette',
   'vent',
   'reqres',
   "auth/LoginPageView",
   "auth/SignupPageView",
   "auth/FBSignupPageView",
   "auth/ForgotPasswordPageView",
   "auth/ResetPasswordPageView"
],
function (Backbone, Marionette, vent, reqres, LoginPageView, SignupPageView, FBSignupPageView, ForgotPasswordPageView, ResetPasswordPageView) {
   "use strict";
   
   /*
      Handles events related to user login/logout/signups
   */
   
   var AuthController = Marionette.Controller.extend({
      
      showLoginPage: function(){
         vent.trigger('domChange:title', reqres.request('page:name').login);
      
         //if user is already logged in, navigate to home
         if(reqres.request('isLoggedIn')){
            vent.trigger("navigate:search");
         } else{
            vent.trigger('mainRegion:show', new LoginPageView());
         }
      },
      
      showSignupPage: function(){
         
      
         vent.trigger('domChange:title', reqres.request('page:name').signup);
         if(reqres.request('isLoggedIn')){
            vent.trigger("navigate:search");
         } else{
            vent.trigger('mainRegion:show', new SignupPageView());
         }
      },
      
      showVerifyPage: function(test){
         vent.trigger('domChange:title', reqres.request('page:name').verify);
         var params = Backbone.history.location.search.split("&");
         var action = params[0].substring(8);
         
         
         if(action == reqres.request('CONSTANTS').RESET_PASSWORD){
            vent.trigger('mainRegion:show', new ResetPasswordPageView());
         }else{
            reqres.request('session').verifyEmail(Backbone.history.location.search, null, {
               success: function(res){
                  vent.trigger("navigate:emptyPage");
                  vent.trigger("flash:alert", {type: 'success', msg: res});
               },error: function(res){
                  vent.trigger("navigate:emptyPage");
                  vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
               }
            });            
         }    
      },
      
      showForgotPasswordPage: function(){
         vent.trigger('domChange:title', reqres.request('page:name').forgotPass);
         //Only show page if user is not logged in
         if(reqres.request('session').get("logged_in")){
            vent.trigger("navigate:search");
         }else{
            vent.trigger('mainRegion:show', new ForgotPasswordPageView());
         }
      },
      
      checkAuth: function(callback){
         //First check if there's bootstrapped user data
         if($('#authenticated_user').length && typeof AUTHENTICATED_USER !== 'undefined'){
            if(AUTHENTICATED_USER){
               reqres.request('session').updateSessionUser(AUTHENTICATED_USER);
               reqres.request('currentUser').set({ucla_temp: UCLA_TEMP});
            }else{
               reqres.request('session').clearSessionUser();
            } 
            if(callback) callback();
            $('#authenticated_user').remove();
            
         }else{
            reqres.request('session').checkAuth({
               complete: function(){
                  if(callback) callback();
               }
            });
         }
      },
      
      
      logoutAttempt: function(){
         reqres.request('session').logout({},{
            success: function(res){
               vent.trigger("navigate:home");
            }
         });
      },
      loginAttempt: function(data, type, callback){

         reqres.request('session').login(data, type, {
            success: function(res){
               
               var circles = reqres.request('session').getCurrentUser().get('circles');
               if(circles.length > 0){
                  vent.trigger("close:modal");
               }
               vent.trigger("navigate:account:posts");
               
            },error: function(res){
               if(callback) callback();
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });
      
         
      },
      signupAttempt: function(data, type, callback){
         var that = this;
         reqres.request('session').signup(data, type, {
            success: function(res){
               vent.trigger("auth:checkAuth", function(){
                  //vent.trigger("close:modal");
                  var circles = reqres.request('session').getCurrentUser().get('circles');
                  if(circles.length > 0){
                     vent.trigger("close:modal");
                  }
                  vent.trigger("navigate:account:posts");
               });
            },error: function(res){
               if(callback) callback();
               vent.trigger("flash:alert", {type: 'error', msg: res.responseText});
            }
         });   
      },

      
      FBSignupCheck: function(data, callback){
         var status;
         
         //if fb id has already been linked, directly log the user in
         reqres.request('session').check_fb_id({fb_id: data.id}, {
            success: function(res){
               status = res.data.status;
            },error: function(res){
               status = 'error';
            }
         });
         
         if(status === 'taken'){
            return vent.trigger('auth:FBLoginAttempt', data);
         }else if(status === 'error'){
            return vent.trigger("flash:alert", {type: 'error'});
         }
         
         //if we can get email from fb, check if the email is already registered
         if(data.email){
            reqres.request('session').check_email({email: data.email}, {
               success: function(res){
                  status = res.data.status;
               },error: function(res){
                  status = 'error';
               }
            });
            
            if(status === 'taken'){
               if(callback) callback();
               return vent.trigger("flash:alert", {type: 'error', msg: "The email in your fb account is already registered by a user."});
            }else if(status === 'error'){
               return vent.trigger("flash:alert", {type: 'error'});
            }
         }
         
         //if all else, sign up for this guy with the fb info
         var data = {
            first_name  : data.first_name,
            email       : data.email
         };
         
         vent.trigger('open:modal', new FBSignupPageView({data:data}), {
            dialogClass: 'auth-dialog'
         });
         
      }
   });
   
   var ac = new AuthController();
   ac.listenTo(vent, "auth:FBSignupCheck", function(data, callback){
      ac.FBSignupCheck(data, callback);
   });
   
   ac.listenTo(vent, "auth:FBsignupAttempt", function(data, callback){
      ac.signupAttempt(data, 'fb', callback);
   });
   
   ac.listenTo(vent, "auth:FBLoginAttempt", function(data, callback){
      //before loggin the person in, check if accoutn exists yet
      reqres.request('session').check_fb_id({fb_id: data.id}, {
         success: function(res){
            status = res.data.status;
         },error: function(res){
            status = 'error';
         }
      });
      
      //if user isn't signedup, redirect to signup
      if(status === 'available'){
         ac.FBSignupCheck(data, callback);
      }else if(status === 'error'){
         return vent.trigger("flash:alert", {type: 'error'});
      }
      if(status==='taken'){
         ac.loginAttempt({}, 'fb', callback);
      }

   });
   
   ac.listenTo(vent, "auth:loginAttempt", function(data, callback){
      ac.loginAttempt(data, 'normal', callback);
   });
   
   ac.listenTo(vent, "auth:logoutAttempt", function(callback){
      ac.logoutAttempt();
   });
   
   ac.listenTo(vent, "auth:signupAttempt", function(data, callback){
      ac.signupAttempt(data, 'normal', callback);
   });
   
   ac.listenTo(vent, "auth:checkAuth", function(callback){
      ac.checkAuth(callback);
   });

   //HELPER function. return true if we should navigate instead of showing modal
   var goNavigate = function(fragment){
      //if fragment is in the array, open modal
      return _.indexOf(['signup', 'login', 'forgot_password', 'session/verify'], fragment) != -1;
   }

   var authModalOptions = {
      dialogClass: 'auth-dialog',
      onShow: function(modal){
         setTimeout(function(){
            modal.options.content.form.focus();
         }, 1); 
      }
   }

   ac.listenTo(vent, "navigate:signup", function(){
      if(goNavigate (Backbone.history.fragment)){
         ac.showSignupPage();
         Backbone.history.navigate('signup');
      }else{
         vent.trigger('open:modal', new SignupPageView(), authModalOptions);
      }
      
   });
   
   ac.listenTo(vent, "navigate:login", function(navigate){
      navigate = navigate || false;
      
      //Decide if we want to actually navigate to the pages open the modal
      if(navigate || goNavigate (Backbone.history.fragment)){
         ac.showLoginPage();
         Backbone.history.navigate('login');
      
      }else{
         vent.trigger('open:modal', new LoginPageView(), authModalOptions);
      }
   });
   
   ac.listenTo(vent, "navigate:forgotPassword", function(){
      //Decide if we want to actually navigate to the pages open the modal
      if(goNavigate (Backbone.history.fragment)){
         
      ac.showForgotPasswordPage();
      Backbone.history.navigate('forgot_password');
      
      }else{
         vent.trigger('open:modal', new ForgotPasswordPageView(), authModalOptions);
      }
      
   });

   return ac;
});


