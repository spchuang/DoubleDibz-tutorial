define([
   'marionette',
   'app',
   'vent',
   'reqres',
],
function (Marionette, App, vent, reqres) {
   "use strict";
   
   /*
      <div class="col-md-10 col-md-offset-1">
         
            <h4 ><small id='fb_status'></small></h4>
            
            
         </div>
   */
   
   var AccountView = Marionette.ItemView.extend({
      template: '<button id="fb-connect-btn" type="button" class="btn btn-default btn-primary "></button>\
                 <p><span class="fb-account-status"></span></p>',
      
      events:{
         'click #save-btn'   :   'onSaveAttempt',
         'click @ui.fbConnectBtn':  'onFbClick'
      },
      ui:{
         fbConnectBtn: '#fb-connect-btn',
         fbStatus:     '.fb-account-status',
      },
      initialize: function(){
        this.user = reqres.request('currentUser'); 
      },
      onRender: function(){
         this.renderFB();
      },
      renderFB:function(){
         if(this.user.get('fb') === 'connected'){
            this.ui.fbStatus.text('You are linked to a Facebook account');
            
            this.ui.fbConnectBtn.hide();
            //this.ui.fbConnectBtn.text('Disconnect');
         }else{
            this.ui.fbStatus.text('You are not linked to Facebook');  
            this.ui.fbConnectBtn.text('Connect');
         }
      },
      onFbClick: function(){
         var that = this;
         if(this.user.get('fb') === 'connected'){
            //for now, lets not allow them to revoke fb link
            return;
         }
         if(this.user.get('fb') === 'connected' && this.user.get('fb_only') === 'true'){ 
            var msg = "You can't disconnect your facebook account unless you set up a password first.";
            return vent.trigger("flash:alert", {type: 'error', msg:  msg});
         }
         this.ui.fbConnectBtn.button('loading');
         
         var FB = reqres.request('FB');

         if(this.user.get('fb') === 'connected'){
            
            //remove the permission
            FB.getLoginStatus(function(response) {
               if(response.status === 'connected'){
                  that.revokeFBAttempt();
               }else{
                  //if for some odd reasons, user isn't authorized with the app (even tho it is linked...)
                  FB.login(function(r) {
                     if(r.status === 'connected'){
                        that.revokeFBAttempt();
                     }else{
                        that.ui.fbConnectBtn.button('reset');
                     }
                  });
               }
           });
            
         }else{
            FB.login(function(r) {
                  
               if(r.status === 'connected'){
                     that.FBLinkAttempt();
               }else{
                  that.ui.fbConnectBtn.button('reset');
               }
            }, {scope: 'public_profile,email', auth_type: 'rerequest'});
         }
      },
      revokeFBAttempt: function(){
         var FB = reqres.request('FB');
         var that = this;
         FB.api('/me/permissions', 'delete', function(response) {

            if(response === true){
               that.FBLinkAttempt();
            }else{
               that.ui.fbConnectBtn.button('reset');
               return vent.trigger("flash:alert", {type: 'error', msg:  response.error.message});
            }
         });
      },
      
      FBLinkAttempt: function(){
         var that = this;
         vent.trigger('account:updateFBLinkAttempt', {
            success: function(){
               //if successful, update this
               that.user.toggleFBStatus();
               that.render();
            },
            complete: function(){
               that.ui.fbConnectBtn.button('reset');
            }
            
            
         });
      }
      
   });
   return AccountView;
});
