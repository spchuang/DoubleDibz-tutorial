define([
   'underscore',
   "reqres",
], function(_, reqres){
    
    
   var UserModel = Backbone.Model.extend({
      
      initialize: function(options){
        this.id = options.id;
      },
      defaults: {
         id: 0,
         user_name: '',
         role: '',
         first_name: '',
         last_name: '',
         email: '',
         //Careful: might be issues with firing predefined backbone events when nesting done this way
         settings: {
            'phone'     : '',
            'bio'       : '',
            'sex_code'  : 0,
         },
         fb: '',
         fb_only: '',
         picture   : '',
         picture_thumb: '',
         circles: [],
         fb_friends: [],
         ucla_temp: false
      },
      url: function(){
         return reqres.request('api').user+"/"+this.user_name;
      },
      
      toggleFBStatus: function(){
        if(this.get('fb') === 'connected'){
           this.set({fb: 'disconnected'});
        }else{
           this.set({fb: 'connected'});
        }
      },
      
      isInCircle: function(c){
         return _.find(this.get('circles'), function(_c){ return _c.id == c.id; });
      },
      
      getFBFriends: function(callback){
         if(this.get('fb_friends')){
            callback(this.get('fb_friends'));
         }
         var FB = reqres.request('FB');
         var that = this;
         FB.getLoginStatus(function(res){
            if(res.status === 'connected'){
               FB.api('/me/friends', 'get', {fields: 'name, picture'}, function(res){
                     var friends = _.object(_.map(res.data, function(friend){
                        return [friend.name, {id: friend.id, picture: friend.picture.data.url}]
                        }));
                     that.set({fb_friends: friends});
                     callback(friends);
               });
            }
         });
      },
      //This is a temporary function till we expand our site
      checkUCLAVerified: function(callback){
         var opts = { url: reqres.request('api').ucla_verified , method: 'GET'};
         this.ajax(null, opts , callback);
      }

      
      });
    
    return UserModel;
});
