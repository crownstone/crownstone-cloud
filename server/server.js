let loopback = require('loopback');
let boot = require('loopback-boot');
let path = require('path');
let bodyParser = require('body-parser');

let oauth2 = require('loopback-component-oauth2');
let express = require('express');
// let updateDS = require('./updateDS.js');

let app = module.exports = loopback();

// configure view handler
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));

app.use(loopback.compress());
// console.log("enable compression");

loopback.TransientModel = loopback.modelBuilder.define('TransientModel', {}, { idInjection: false });

app.use(loopback.context());
app.use(loopback.token());
// app.use(function setCurrentUser(req, res, next) {
//   if (!req.accessToken) {
//     return next();
//   }
//   console.log("set user");
//   app.models.user.findById(req.accessToken.userId, function(err, user) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       return next(new Error('No user with this access token was found.'));
//     }
//     // let loopbackContext = loopback.getCurrentContext();
//     // if (loopbackContext) {
//     //   loopbackContext.set('currentUser', user);
//     // }
//     req.currentUser = user;
//     next();
//   });
// });

// app.middleware('routes:before', function(req, res, next) {
//   // console.log(req);
//   console.log("access token:", req.accessToken);
//   if (!req.accessToken) {
//     return next();
//   }
//   app.models.user.findById(req.accessToken.userId, function(err, user) {
//     if (err) {
//       return next(err);
//     }
//     // if (!user) {
//     //   return next(new Error('No user with this access token was found.'));
//     // }
//     updateDS.updateUserDS(user, app, next);
//   });
// });

app.start = function() {
  // start the web server
  let port = process.env.PORT || 3000;
  return app.listen(port, function () {
    app.emit('started');
    let baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      let explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});


let options = {
  dataSource: app.dataSources.db, // Data source for oAuth2 metadata persistence
  loginPage: '/login', // The login page URL
  loginPath: '/login' // The login form processing URL
};

oauth2.oAuth2Provider(
  app, // The app instance
  options // The options
);