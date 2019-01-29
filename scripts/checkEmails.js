#!/bin/node


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
let app = require("../server/server");
const ops = require("./endpointOps");

let mainUser = "alexdemulder@gmail.com";
let invitedExistingAccount = "alexdemulder+existing@gmail.com";
let invitedNewAccount = "alexdemulder+new@gmail.com";

let mainUserObj = {token: null, id: null, email: mainUser}
let sphereId = null

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
    console.log("logged in")
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
    console.log("Sphere Created", reply)
    sphereId = reply.id;
    return ops.inviteUser(invitedExistingAccount, sphereId, mainUserObj)
  })
  .then((reply) => {
    return ops.inviteUser(invitedNewAccount, sphereId, mainUserObj)
  })
  .then((reply) => {
    console.log("COMPLETED! Use Control+C to close the session")
  })
  .catch((err) => { console.log('err', err)})

