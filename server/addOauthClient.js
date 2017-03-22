"use strict";
let crypto = require('crypto');

let allScopes = [
  'user_information',     // get /api/users/me
  'user_location',        // get /api/users/:id/currentLocation
  'stone_information',    // get /api/Stones
  'switch_stone',         // put /api/Stones/:id/setSwitchStateRemotely
  'power_consumption',    // get /api/Stones/:id/currentEnergyUsage
  'all'                   // access to everything
];


function createSecret() {
  return crypto.randomBytes(25).toString('hex');
}

function performOauthClientOperations(app) {
  let permissionModel = app.dataSources.userDs.getModel('OAuthClientApplication');
  // clearClientDatabase(permissionModel)
  //   .then(() => {
  createClient(permissionModel, "Crownstone", allScopes);
    // })
    // .catch((err) => {console.log(err)})
}

function clearClientDatabase(permissionModel) {
  return permissionModel.destroyAll()
    .then(() => { console.log("ALL CLIENTS REMOVED"); })
    .catch((err) => { console.log("Error while deleting clients:", err); })
}

function createClient(permissionModel, clientName, scopes) {
  return permissionModel.find({"name":clientName})
    .then((result) => {
      if (result.length === 0) {
        return permissionModel.create({
          name: clientName,
          scopes: [scopes],
          clientSecret: createSecret(),
          issuedAt: new Date()
        })
      }
      else {
        throw new Error("Client " + clientName + " is already in the database.");
      }
    })
    .then((result) => {
      console.log("Client ", clientName, " created successfully!");
      console.log("Store the clientID: ", result.id, " somewhere secure.");
      console.log("Store the clientSecret: ", result.clientSecret);
    })
    .catch((err) => { console.log("Error adding client:", err); })

}





module.exports = performOauthClientOperations;