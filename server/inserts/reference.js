"use strict";
const fs = require("fs");


let CHANGE_DATA = false;

function performReference(app) {
  console.log("Starting referennce test run");

  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
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
  stoneModel.find({where:{hardwareVersion: '101030100000000000000000000QFAAB0'}})
    .then(() => {
      console.log("Reference, DONE")
    })
    .catch((err) => {
      console.log("Error during reference:", err);

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

module.exports = performReference;
