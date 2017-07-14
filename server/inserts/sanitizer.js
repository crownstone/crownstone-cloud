"use strict";

let hardwareVersions = require("../constants/hardwareVersions");

let plugAndBuiltinVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns());

function performSanitation(app) {
  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let locationModel = app.dataSources.mongoDs.getModel('Location');
  let stoneModel = app.dataSources.mongoDs.getModel('Stone');
  let devicesModel = app.dataSources.mongoDs.getModel('Device');
  let installationModel = app.dataSources.mongoDs.getModel('Installation');
  let appliancesModel = app.dataSources.mongoDs.getModel('AppliancesModel');

  devicesModel.find()
    .then((devices) => {
      if (devices.length > 0) {
        return promiseBatchPerformer(devices,0,(device) => {
          let ownerId = device.ownerId;
          console.log('ownerId',ownerId)
          return new Promise((resolve, reject) => {
            userModel.findById(ownerId)
              .then((result) => {
                if (!result) {
                  console.log("device", device);
                }
              })
              .then(() => { resolve(); })
              .catch((err) => { reject(err); })
          })
        })
      }
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

module.exports = performSanitation;
