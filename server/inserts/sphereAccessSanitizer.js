"use strict";
const fs = require("fs");
let CHANGE_DATA = false;

function performSphereAccessSanitation(app) {
  console.log("Starting SphereAccess Sanitation test run");

  let hubModel = app.dataSources.mongoDs.getModel('user');
  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let sphereAccessModel = app.dataSources.mongoDs.getModel('SphereAccess');

  let allHubs = [];
  let allUsers = [];
  let allSpheres = [];

  let hubIds = {};
  let userIds = {};
  let allSphereIds = {};
  let unownedSphereIds = {};

  hubModel.find()
    .then((hubs) => {
      allHubs = hubs;
      allHubs.forEach((hub) => {
        hubIds[hub.id] = true;
      })
    })
    .then(() => {
      return userModel.find()
    })
    .then((results) => {
      allUsers = results;
      allUsers.forEach((user) => {
        userIds[user.id] = true;
      })
    })
    .then(() => {
      return sphereModel.find({ include: "users" })
        .then((results) => {
          allSpheres = results;
          results.forEach((sphere) => {
            allSphereIds[sphere.id] = true;
            let unused = true;
            let unowned = false;
            if (userIds[sphere.ownerId] === undefined) { unowned = true; }
            let sphereUsers = sphere.users();
            for (let i = 0; i < sphereUsers.length; i++) {
              if (userIds[sphereUsers[i].id] !== undefined) {
                unused = false;
                break;
              }
            }
            if (unused && unowned) {
              unownedSphereIds[sphere.id] = true;
            }
          })
          let unownedAmount = Object.keys(unownedSphereIds).length;
          console.log("Unowned spheres: ", unownedAmount, 'out of', allSpheres.length, ' (',  Math.round((unownedAmount / allSpheres.length)*100), '% )');
        })
    })
    .then(() => {
      return sphereAccessModel.find()
        .then((results) => {
          let deleteSphereAccessIds = [];
          for (let sphereAccess of results) {
            if (allSphereIds[sphereAccess.sphereId] === undefined) {
              // deleteSphereAccessIds.push(String(sphereAccess.id));
              console.log("Sphere in Access is Missing", String(sphereAccess.sphereId));
            }
            else if (sphereAccess.role === 'hub') {
              if (hubIds[sphereAccess.userId] === undefined) {
                deleteSphereAccessIds.push(String(sphereAccess.id));
                console.log("Hub in Access is Missing", String(sphereAccess.userId));
              }
            }
            else {
              if (userIds[sphereAccess.userId] === undefined) {
                // deleteSphereAccessIds.push(String(sphereAccess.id));
                console.log("User in Access is Missing", String(sphereAccess.userId));
              }
            }
          }
          // sphereAccessModel.find({where: {id: {inq: deleteSphereAccessIds}}})
          //   .then((res) => { console.log(res.length); })

          console.log("Invalid SphereAccess: ", deleteSphereAccessIds.length, 'out of', results.length, ' (',  Math.round((deleteSphereAccessIds.length / results.length)*100), '% )');
        })
    })
    .then(() => {
      console.log("DONE")
    })
    .catch((err) => {
      console.log("Error during sanitation:", err);

    })


}

let promiseBatchPerformer = (arr, index, method) => {
  return new Promise((resolve, reject) => {
    if (index < arr.length) {
      method(arr[index])
        .then(() => {
          return promiseBatchPerformer(arr, index+1, method);
        })
        .then(() => {
          resolve()
        })
        .catch((err) => reject(err))
    }
    else {
      resolve();
    }
  })
};

module.exports = performSphereAccessSanitation;
