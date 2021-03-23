#!/bin/node

const KILL_WHEN_DONE       = true;

let mainUser               = "alexdemulder@gmail.com";
let invitedExistingAccount = "alexdemulder+existing@gmail.com";
let invitedNewAccount      = "alexdemulder+new@gmail.com";

// let mainUser               = "0937558@hr.nl";
// let invitedExistingAccount = "0937558+existing@hr.nl";
// let invitedNewAccount      = "0937558+new@hr.nl";

// let mainUser               = "crowntest1@outlook.com";
// let invitedExistingAccount = "testjuh@outlook.com";
// let invitedNewAccount      = "crown.test@outlook.com";

/** preperation:
*
* edit the datasources.local.js to only have this field active, the rest can be empty or commented:
*  sendgridDs: {
    "connector": "loopback-connector-sendgrid",
    "api_user": "user_here",
    "api_key": "key_here
  }
*
*/


// this will start the cloud server
global.__RUNNING_TEST_SCRIPTS = true
const app = require("../../server/server");
const ops = require("./lib/endpointOps");

let mainUserObj = {token: null, id: null, email: mainUser}
let sphereId = null


console.log("Checking config for databases. Must be working in memory to use this script...")
let datasources  = require('../../server/datasources.' + (process.env.NODE_ENV || 'local'));
if (!(Object.keys(datasources).length === 1 && datasources['sendgridDs'] !== undefined)) {
  console.log("Datasource contains either database information or no sendgridDs entry. Closing.")
  return
}
console.log("Config file check passed. Starting email script.")



ops.createUser(mainUser)
  .then((reply) => {
    console.log("Created User, marking as verified....")
    return ops.markAsVerified(reply.id)
  })
  .then(() => {
    console.log("Verified User, logging in...")
    return ops.login(mainUser)
  })
  .then((reply) => {
    console.log("Logged in!")
    mainUserObj.id = reply.userId
    mainUserObj.token = reply.id
  })
  .then(() => {
    console.log("Triggering Forgot Password email...")
    return ops.forgotPassword(mainUserObj)
  })
  .then(() => {
    return ops.createUser(invitedExistingAccount)
  })
  .then((reply) => {
    return ops.markAsVerified(reply.id)
  })
  .then(() => {
    return ops.createSphere(mainUserObj)
  })
  .then((reply) => {
    console.log("Sphere Created, inviting existing user...")
    sphereId = reply.id;
    return ops.inviteUser(invitedExistingAccount, sphereId, mainUserObj)
  })
  .then((reply) => {
    console.log("Sphere Created, inviting new user...")
    return ops.inviteUser(invitedNewAccount, sphereId, mainUserObj)
  })
  .then((reply) => {
    if (KILL_WHEN_DONE === true) {
      console.log("COMPLETED! Closing session...")
      setTimeout(() => {process.exit(0)}, 1500)
    }
    else {
      console.log("COMPLETED! Press Control+C to close the session.")
    }
  })
  .catch((err) => { console.log('err', err)})

