"use strict";

let APP = null;
let CHANGE_DATA = false;

const { ask, promiseBatchPerformer } = require("./insertUtil");

function performAppOperations(app) {
  APP = app;

  new Promise((resolve, reject) => { resolve() })
    .then(() => { return getApp('Crownstone.consumer') })
    .then((data) => { console.log("data",JSON.stringify(data)) })
    .then(() => {
      console.log("performAppOperations: Done")
    })
    .catch((err) => {
      console.log("ERROR: performAppOperations", err);
    })

  // new Promise((resolve, reject) => { resolve() })
  //   .then(() => { return getApp('Crownstone.installer') })
  //   .then((data) => { console.log("data",JSON.stringify(data)) })
  //   .then(() => {
  //     console.log("performAppOperations: Done")
  //   })
  //   .catch((err) => {
  //     console.log("ERROR: performAppOperations", err);
  //   })

  // showAppDetails()
  // clearAppDatabase(AppModel);

  // create the CrownstoneApp
  // let appName = 'Crownstone.consumer';
  // // hide keys in the keyData which is in .gitignore
  // let keys = require('./keyData/' + appName);
  // createApp(AppModel, appName, keys);
}

function clearAppDatabase() {
  let AppModel = APP.dataSources.mongoDs.getModel('App');
  return AppModel.destroyAll()
    .then(() => { console.log("ALL APPS REMOVED"); })
}

function deleteApp(appName) {
  let AppModel = APP.dataSources.mongoDs.getModel('App');
  return AppModel.find({"name":appName})
    .then((results) => {
      let deletionPromises = [];
      results.forEach((result) => {
        deletionPromises.push(AppModel.destroyById(result.id))
      });
      return Promise.all(deletionPromises);
    })
}

function createApp(appName, keys) {
  let AppModel = APP.dataSources.mongoDs.getModel('App');
  return AppModel.create({
    name: appName,
    pushSettings: {
      apns: {
        keyToken: keys.apnsToken,
        keyId: keys.apnsKeyId,
        teamId: keys.apnsTeamId,
      },
      gcm: {
        serverApiKey: keys.gcmToken
      }
    }
  })
    .then((result) => {
      console.log("App ", appName, " created successfully!");
      console.log("result:", result);
    })
    .catch((err) => { console.log("Error adding client:", err); })
}

function showAppDetails(appName) {
  let AppModel = APP.dataSources.mongoDs.getModel('App');
  AppModel.find({"name": appName})
    .then((result) => {
      if (result.length === 1) {
        console.log("App ", appName, " found in database!");
        console.log("result:", JSON.stringify(result));
      }
      else if (result.length === 0) {
        console.log("App ", appName, " not found!");
      }
      else {
        console.log("WARN -- There are multiple Apps with this name:", appName);
      }
    })
    .catch((err) => { console.log("Error during app lookup", err); })
}

function getApp(appName) {
  let AppModel = APP.dataSources.mongoDs.getModel('App');
  return AppModel.find({"name": appName})
    .then((result) => {
      if (result.length === 1) {
        return result[0];
      }
      else {
        throw "cant find app"
      }
    })
    .catch((err) => { console.log("Error during app lookup", err); })
}





module.exports = performAppOperations;
