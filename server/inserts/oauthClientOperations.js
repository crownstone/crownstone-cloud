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


/**
 * Util method to generate a clientSecret. The secret is required to obtain a token.
 */
function createSecret() {
  return crypto.randomBytes(25).toString('hex');
}

function performOauthClientOperations(app) {
  let permissionModel = app.dataSources.userDs.getModel('OAuthClientApplication');
  showClientDetails(permissionModel, 'Alexa_Amazon')
  // uncomment this line to delete ALL CLIENTS FROM THE OAUTH DATABASE
  // clearClientDatabase(permissionModel).catch((err) => { console.log("Error while deleting clients:", err); })


  // empty promise so all clients that are added are in matching then statements
  // new Promise((resolve, reject) => { resolve() })
  //   .then(() => { createClient(permissionModel, "Crownstone", allScopes); })
  //   .then(() => { createClient(permissionModel, "Alexa_Amazon", ['user_information', 'user_location', 'stone_information', 'switch_stone']); })
  //   .catch((err) => { console.log("Error during performOauthClientOperations",err); })
}

function clearClientDatabase(permissionModel) {
  return permissionModel.destroyAll()
    .then(() => { console.log("ALL CLIENTS REMOVED"); })
}

function deleteClientsWithName(permissionModel, clientName) {
  return permissionModel.find({"name":clientName})
    .then((results) => {
      let deletionPromises = [];
      results.forEach((result) => {
        deletionPromises.push(permissionModel.destroyById(result.id))
      });
      return Promise.all(deletionPromises);
    })
}

function createClient(permissionModel, clientName, scopes) {
  return permissionModel.find({"name":clientName})
    .then((result) => {
      if (result.length === 0) {
        return permissionModel.create({
          name: clientName,
          scopes: scopes,
          clientSecret: createSecret(),
          issuedAt: new Date()
        })
      }
      else {
        throw "Client " + clientName + " is already in the database.";
      }
    })
    .then((result) => {
      console.log("Client ", clientName, " created successfully!");
      console.log(clientName, "has access to the following scopes:", result.scopes);
      console.log("Store the clientID: ", result.id, " and");
      console.log("the clientSecret: ", result.clientSecret, " somewhere secure.");
    })
    .catch((err) => { console.log("Error adding client:", err); })
}

function showClientDetails(permissionModel, clientName) {
  permissionModel.find({"name":clientName})
    .then((result) => {
      if (result.length === 1) {
        console.log("Client ", clientName, " found in database!");
        console.log(clientName, "has access to the following scopes:", result.scopes);
        console.log("Store the clientID: ", result.id, " and");
        console.log("the clientSecret: ", result.clientSecret, " somewhere secure.");
      }
      else if (result.length === 0) {
        console.log("Client ", clientName, " not found!");
      }
      else {
        console.log("WARN -- There are multiple entries with this name:", result);
      }
    })
    .catch((err) => { console.log("Error during client lookup", err); })
}





module.exports = performOauthClientOperations;