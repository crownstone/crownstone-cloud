"use strict";

const loopback = require('loopback');
const boot = require('loopback-boot');
const path = require('path');
const bodyParser = require('body-parser');
const compression = require('compression');

const oauth2 = require('loopback-component-oauth2');
const express = require('express');
const session = require('express-session');

const MongoStore = require('connect-mongo')(session);
let datasources = require('./datasources.' + (process.env.NODE_ENV || 'local'));


let store;
if (datasources.userDs && datasources.userDs.url) {
  store = new MongoStore({url: datasources.userDs.url, mongoOptions: {collection: 'OAuthSessions'}});
}

// let updateDS = require('./updateDS.js');

const app = module.exports = loopback();

// configure view handler
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.middleware('session', session({
  secret: process.env.SESSION_SECRET || datasources.sessionKey.key || 'keyboard kittens',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true
}));



app.use(express.static('public'));

// configure body parser
app.use(bodyParser.urlencoded({extended: true}));

app.use(compression());
// console.log("enable compression");



loopback.TransientModel = loopback.modelBuilder.define('TransientModel', {}, { idInjection: false });


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
  if (err) { throw err; }

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});


let options = {
  dataSource: app.dataSources.userDs, // Data source for oAuth2 metadata persistence
  resourceServer: true,
  authorizationServer: true,
  decisionView: 'dialog',
  loginPage: '/loginOauth', // The login page URL
  loginPath: '/loginOauthStep2', // The login form processing URL
  tokenPath: '/oauth/token',
};

oauth2.oAuth2Provider(
  app, // The app instance
  options // The options
);


// this is only allowed in a local environment
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
  // // Uncomment these lines to view/add/remove/modify the OAUTH2 clients
  // let performOauthClientOperations = require("./inserts/oauthClientOperations");
  // performOauthClientOperations(app);
  //
  // // Uncomment these lines to view/add/remove/modify the registered Apps
  // let performAppOperations = require("./inserts/appOperations");
  // performAppOperations(app);
  //
  // // Uncomment these lines to view/add/remove/modify released firmwares/bootloader versions
  // let performFirmwareOperations = require("./inserts/firmwareReleases");
  // performFirmwareOperations(app);
}

