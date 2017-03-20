"use strict";

const loopback = require('loopback');
const boot = require('loopback-boot');
const path = require('path');
const bodyParser = require('body-parser');

const oauth2 = require('loopback-component-oauth2');
const express = require('express');
// let updateDS = require('./updateDS.js');

const app = module.exports = loopback();

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
//
let options = {
  dataSource: app.dataSources.db, // Data source for oAuth2 metadata persistence
  resourceServer: true,
  authorizationServer: true,
  loginPage: '/loginOauth', // The login page URL
  loginPath: '/loginOauthStep2', // The login form processing URL
  tokenPath: "/oauth/token",
  addHttpHeaders: "X-"
};

oauth2.oAuth2Provider(
  app, // The app instance
  options // The options
);
//

let permissionModel = app.dataSources.db.getModel('OAuthClientApplication');

permissionModel.destroyAll()
  .then(() => {
    return permissionModel.create({
      id: 'Crownstone',
      name:"Crownstone",
      scopes: ['read-all','write-all'],
      clientSecret: 'secret',
      issuedAt: new Date()
    })
  })
.then(() => {
  return permissionModel.find();
})
.then((data) => {
  console.log("data", data);
})


//http://localhost:3000/oauth/authorize?response_type=code&client_id=2282804de9ae0a3581e017533f0831d9&redirect_uri=http://www.google.com