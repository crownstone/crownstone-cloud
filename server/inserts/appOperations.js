function performOauthClientOperations(app) {
  let AppModel = app.dataSources.mongoDs.getModel('App');

  // create the CrownstoneApp
  let appName = 'Crownstone.consumer';
  // hide keys in the keyData which is in .gitignore
  let keys = require('./keyData/' + appName);
  createApp(AppModel, appName, keys);
}

function clearAppDatabase(AppModel) {
  return AppModel.destroyAll()
    .then(() => { console.log("ALL APPS REMOVED"); })
}

function deleteApp(AppModel, appName) {
  return AppModel.find({"name":appName})
    .then((results) => {
      let deletionPromises = [];
      results.forEach((result) => {
        deletionPromises.push(AppModel.destroyById(result.id))
      });
      return Promise.all(deletionPromises);
    })
}

function createApp(AppModel, appName, keys) {
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

function showAppDetails(AppModel, appName) {
  AppModel.find({"name": appName})
    .then((result) => {
      if (result.length === 1) {
        console.log("App ", appName, " found in database!");
        console.log("result:", result);
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





module.exports = performOauthClientOperations;