define([
  'marionette',
  'header/HeaderController',
  'auth/AuthController',
  'account/AccountController',
  'general/GeneralController',
  'posts/PostController',
  'buy_requests/BuyRequestController',
  'search/SearchController',
  'messages/MessageController',
  'notifications/NotificationController',
  'general/FlashController'
],
function (Marionette, HeaderController, AuthController, AccountController, GeneralController, PostController, BuyRequestController, SearchController, MessageController, NotificationController, FlashController) {
   "use strict";   
   /*
      NOTE: Routers are checked in the inverse order of the order they're added.
   */
   var AppRouter = {
      SearchController: Marionette.AppRouter.extend({
         appRoutes: {   
            ':circle' : 'showSearchPageFromUrl',
            "daily-listing(/)"     : "showDailyListingPage",
            "fb/daily-listing(/)"  : "showDailyListingPage"
         },
         controller: SearchController
      }),
   
      AuthRouter: Marionette.AppRouter.extend({
         appRoutes: {
            "login(/)": "showLoginPage",
            "signup(/)": "showSignupPage",
            "session/verify(/)": "showVerifyPage",
            "forgot_password(/)": "showForgotPasswordPage"
         },
         controller: AuthController
      }),
      
      AccountRouter: Marionette.AppRouter.extend({
         appRoutes: {
            "my/settings(/)"     : "showSettingsPage",
            "help(/)"            : "showHelpPage",
            "my/bookmarks(/)"    : "showMyBookmarksPage",
            "my/posts(/)"        : "showMyPostsPage"
         },
         controller: AccountController
      }),
      
      HeaderRouter:  Marionette.AppRouter.extend({
         AppRoutes: {},
         controller: HeaderController
      }),
      
      MessageRouter: Marionette.AppRouter.extend({
         appRoutes: {
            'messages(/)'           : 'showInbox',
            'messages/:post_id(/)'  : 'showMessagesPostFromURL',
            "fb/messages/:post_id(/)": "showMessagesPostFromURL"
         },
         controller: MessageController
      }),
      
      NotificationRouter:  Marionette.AppRouter.extend({
         appRoutes: {

         },
         controller: NotificationController
      }),
      
      GeneralRouter: Marionette.AppRouter.extend({
         appRoutes: {
            "(/)"                 : "showHomePage",
            "about/legal/terms(/)":  'showTermPage',
            "about/us(/)"         :  'showAboutPage'
         },
         controller: GeneralController
      }),
      
      PostRouter: Marionette.AppRouter.extend({
         appRoutes: {
            "posts/create(/)"      : "showCreatePostPage",
            "posts/:id/chats(/)"   : "showPostChatsPage",
            "posts/:id/edit(/)"    : "showEditPostPage",
            "posts/:id(/)"         : "showItemPostPage",
            "fb/posts/:id(/)"      : "showItemPostPage",
            "u/:user_name(/)"      : "showUserPostPage"
         },
         controller: PostController
      }),
      
      BuyRequestRouter: Marionette.AppRouter.extend({
         appRoutes: {
            "buy_requests/create(/)": "showCreateBuyRequestPage",
            "buy_requests/:id/edit(/)": "showEditBuyRequestPage",
         },
         controller: BuyRequestController
      }),
      
   };
   
   return AppRouter;
   
   
});
