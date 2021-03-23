"use strict";
const fs = require("fs");


let CHANGE_DATA = false;

function performReference(app) {
  console.log("Starting referennce test run");

  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let sphereAccessModel = app.dataSources.mongoDs.getModel('SphereAccess');
  let locationModel = app.dataSources.mongoDs.getModel('Location');
  let stoneModel = app.dataSources.mongoDs.getModel('Stone');
  let devicesModel = app.dataSources.mongoDs.getModel('Device');
  let installationModel = app.dataSources.mongoDs.getModel('AppInstallation');
  let appliancesModel = app.dataSources.mongoDs.getModel('Appliance');
  let powerUsageModel = app.dataSources.mongoDs.getModel('PowerUsage');
  let energyUsageModel = app.dataSources.mongoDs.getModel('EnergyUsage');

  let allUsers = [];
  let allDevices = [];
  let allSpheres = [];
  let allStones = [];
  let allLocations = [];
  let allAppliances = [];
  let allInstallations = [];
  let allPowerUsages = [];
  let allEnergyUsages = [];

  let userIds = {};
  let allSphereIds = {};
  let allSphereUsers = {};
  let allStoneIds = {};
  let allDeviceIds = {};

  let unownedEnergyUsageIds = {};
  let unownedPowerUsageIds = {};
  let unownedDevicesIds = {};
  let unownedSphereIds = {};
  let unownedStoneIds = {};
  let unownedLocationIds = {};
  let unownedApplianceIds = {};
  let unownedInstallationIds = {};


  // get all users
  // stoneModel.find({fields:{sphereId:true}})
  //   .then((stones) => {
  //     stones.forEach((stone) => {
  //       requiredSphereIds[stone.sphereId] = true;
  //     })
  //
  //     let sphereIds = Object.keys(requiredSphereIds);
  //     return sphereAccessModel.find({where:{sphereId:{inq: sphereIds}, invitePending:false, role:{inq:["admin","member"]}}, fields:{userId: true}})
  //   })
  //   .then((access) => {
  //     access.forEach((userData) => {
  //       requiredSphereIds[userData.userId] = true;
  //     })
  //     return userModel.find({where:{id:{inq:Object.keys(requiredSphereIds)}}, fields:{email:true}})
  //   })
  //   .then((users) => {
  //     users.forEach((user) => {
  //       console.log(user.email)
  //     })
  //   })
  //   .catch((err) => {
  //     console.log("Error during reference:", err);
  //   })

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

module.exports = performReference;
