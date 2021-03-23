"use strict";

const SSE = require("./modules/SSEManager")

const loopback    = require('loopback');
const boot        = require('loopback-boot');
const path        = require('path');
const bodyParser  = require('body-parser');
const compression = require('compression');

const oauth2  = require('loopback-component-oauth2');
const express = require('express');
const session = require('express-session');

const MongoStore = require('connect-mongo')(session);
let datasources  = require('./datasources.' + (process.env.NODE_ENV || 'local'));
let config       = require('./config.' + (process.env.NODE_ENV || 'local'));

if (!process.env.NODE_ENV) {
  Error.stackTraceLimit = 100;
}

let store;
if (datasources.userDs && datasources.userDs.url) {
  store = new MongoStore({url: datasources.userDs.url, mongoOptions: {collection: 'OAuthSessions'}});
}

const app = module.exports = loopback();

// configure view handler
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.middleware('session', session({
  secret: process.env.SESSION_SECRET || (config.sessionKey && config.sessionKey.key) || 'keyboard kittens',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true
}));


app.use(express.static('public'));

// configure body parser
app.use(bodyParser.urlencoded({extended: true, limit:'512kb'}));
app.use(bodyParser.json({limit:'512kb'}));

app.use(compression());

loopback.TransientModel = loopback.modelBuilder.define('TransientModel', {}, { idInjection: false });


app.start = function() {
  // start the web server
  let port = process.env.PORT || 3000;
  let server = app.listen(port, function () {
    app.emit('started');

    let baseUrl = process.env.BASE_URL || app.get('url').replace(/\/$/, '');
    if (baseUrl.indexOf("http://") === -1 && baseUrl.indexOf("https://") === -1) {
      baseUrl = 'https://' + baseUrl
    }

    console.log('Web server listening at: %s', baseUrl);
    app.__baseUrl = baseUrl;
    if (app.get('loopback-component-explorer')) {
      let explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
  SSE.init(server);

  return server;
};


// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) { throw err; }

  // start the server if `$ node server.js`
  if (require.main === module || global.__RUNNING_TEST_SCRIPTS === true) {
    app.start();
  }
});


let options = {
  dataSource: app.dataSources.userDs, // Data source for oAuth2 metadata persistence
  resourceServer: true,
  authorizationServer: true,
  decisionView: 'dialog',
  loginPage: '/loginOauth',      // The login page URL
  loginPath: '/loginOauthStep2', // The login form processing URL
  tokenPath: '/oauth/token',
};

oauth2.oAuth2Provider(
  app, // The app instance
  options // The options
);



// this is only allowed in a local environment
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
  // Uncomment these lines to view/add/remove/modify the OAUTH2 clients
  // IMPORTANT: these users are shared between dev and release cloud!
  // let performOauthClientOperations = require("./inserts/oauthClientOperations");
  // performOauthClientOperations(app);

  // // Uncomment these lines to view/add/remove/modify the registered Apps
  // let performAppOperations = require("./inserts/appOperations");
  // performAppOperations(app);
  //
  // // Uncomment these lines to view/add/remove/modify released firmwares/bootloader versions
  // let performFirmwareOperations = require("./inserts/firmwareReleases");
  // performFirmwareOperations(app);
  //
  // // Uncomment these lines to view/add/remove/modify the whitelist of the webhook URIs
  // let performWhitelistOperations = require("./inserts/whitelistOperations");
  // performWhitelistOperations(app);
  //
  // // Uncomment these lines to run test scripts on the database
  // let performReference = require("./inserts/reference");
  // performReference(app);

  // Uncomment these lines to perform database cleanup operations
  // let performSanitation = require("./inserts/sanitizer");
  // performSanitation(app);

  // // Uncomment these lines to run operations scripts on the database
  // let performDatabaseOperations = require("./inserts/databaseOps");
  // performDatabaseOperations(app);

  // // Uncomment these lines to run operations scripts on the database
  // let performMigration = require("./inserts/migration");
  // performMigration(app);

}
