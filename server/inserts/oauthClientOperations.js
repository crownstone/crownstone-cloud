"use strict";
let crypto = require('crypto');

let allScopes = [
  'user_information',     // get /api/users/me
  'location_information',
  'sphere_information',
  'user_location',        // get /api/users/:id/currentLocation
  'user_id',              // get /api/users/userId
  'stone_information',    // get /api/Stones/all
  'switch_stone',         // put /api/Stones/:id/setSwitchStateRemotely
  'power_consumption',    // get /api/Stones/:id/currentPowerUsage
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

  // showClientDetails(permissionModel, 'Alexa')
  // uncomment this line to delete ALL CLIENTS FROM THE OAUTH DATABASE
  // clearClientDatabase(permissionModel).catch((err) => { console.log("Error while deleting clients:", err); })

  // empty promise so all clients that are added are in matching then statements
  new Promise((resolve, reject) => { resolve() })
    .then(() => { return showClientDetails(permissionModel, "Google"); })
    // .then(() => { return updateClientName(permissionModel, "Google_assistant","Google"); })
    // .then(() => { return deleteClientsWithName(permissionModel, "Alexa_Amazon"); })
    // .then(() => { return createClient(permissionModel, "GoogleHomeTest", ["all"]); })
    // .then(() => { return createClient(permissionModel, "test", allScopes); })
    // .then(() => { return updateClient(permissionModel, "Google", ["user_id", "stone_information", "switch_stone"]); })
    // .then(() => { createClient(permissionModel, "Google_assistant", ['user_information','user_location','stone_information','switch_stone']); })
    .then(() => { console.log("OAUTH DONE")})
    .catch((err) => { console.log("Error during performOauthClientOperations",err); })
}

function updateClient(permissionModel, clientName, scopes) {
  return permissionModel.find({where:{name: clientName}})
    .then((results) => {
      if (results.length === 1) {
        let user = results[0];
        user.scopes = scopes;
        return user.save()
      }
      console.log("Error: Not just one result found:", results);
    })
}


function updateClientName(permissionModel, clientName, newName) {
  return permissionModel.find({where:{name: clientName}})
    .then((results) => {
      if (results.length === 1) {
        let user = results[0];
        user.name = newName;
        return user.save()
      }
      console.log("Error: Not just one result found:", results);
    })
}


function clearClientDatabase(permissionModel) {
  return permissionModel.destroyAll()
    .then(() => { console.log("ALL CLIENTS REMOVED"); })
}

function deleteClientsWithName(permissionModel, clientName) {
  return permissionModel.find({where:{name: clientName}})
    .then((results) => {
      let deletionPromises = [];
      results.forEach((result) => {
        deletionPromises.push(permissionModel.destroyById(result.id))
      });
      return Promise.all(deletionPromises);
    })
}

function createClient(permissionModel, clientName, scopes) {
  // validate scopes
  for (let i = 0; i < scopes.length; i++) {
    if (allScopes.indexOf(scopes[i]) === -1) {
      return new Promise((resolve, reject) => { reject("Unknown Scope:" + scopes[i])})
    }
  }
  return permissionModel.find({where:{name: clientName}})
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
  permissionModel.find({where:{name: clientName}})
    .then((results) => {
      if (results.length === 1) {
        console.log("Client ", clientName, " found in database!");
        console.log(clientName, "has access to the following scopes:", results[0].scopes);
        console.log("Store the clientID: ", results[0].id, " and");
        console.log("the clientSecret: ", results[0].clientSecret, " somewhere secure.");
      }
      else if (results.length === 0) {
        console.log("Client ", clientName, " not found!");
      }
      else {
        console.log("WARN -- There are multiple entries with this name:", results);
      }
    })
    .catch((err) => { console.log("Error during client lookup", err); })
}





module.exports = performOauthClientOperations;
