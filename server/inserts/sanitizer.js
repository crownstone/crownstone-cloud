"use strict";
const fs = require("fs");
let hardwareVersions = require("../constants/hardwareVersions");

let plugAndBuiltinVariations = hardwareVersions.util.getAllPlugs().concat(hardwareVersions.util.getAllBuiltIns());

let CHANGE_DATA = false;

function performSanitation(app) {
  console.log("Starting Sanitation test run");

  let hubModel = app.dataSources.mongoDs.getModel('user');
  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let locationModel = app.dataSources.mongoDs.getModel('Location');
  let stoneModel = app.dataSources.mongoDs.getModel('Stone');
  let schedulesModel = app.dataSources.mongoDs.getModel('Schedule');
  let activityLogModel = app.dataSources.mongoDs.getModel('ActivityLog');
  let devicesModel = app.dataSources.mongoDs.getModel('Device');
  let installationModel = app.dataSources.mongoDs.getModel('AppInstallation');
  let appliancesModel = app.dataSources.mongoDs.getModel('Appliance');
  let powerUsageModel = app.dataSources.mongoDs.getModel('PowerUsage');
  let energyUsageModel = app.dataSources.mongoDs.getModel('EnergyUsage');

  let allHubs = [];
  let allUsers = [];
  let allDevices = [];
  let allSpheres = [];
  let allStones = [];
  let allLocations = [];
  let allAppliances = [];
  let allInstallations = [];
  let allPowerUsages = [];
  let allEnergyUsages = [];

  let hubIds = {};
  let userIds = {};
  let allSphereIds = {};
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

  let usedDevices = [];

  /**
   .then((fw) => {
      let x = APP.dataSources.mongoDs.getModel('Stone')
      return x.find({hardwareVersion:{$exist: true}})
    })
   .then((res) => {
      let versions = {};
      res.forEach((st) => {
        if (!versions[st.hardwareVersion]) {
          versions[st.hardwareVersion] = {count: 0, users: []}
        }
        versions[st.hardwareVersion].count++;

      })
      console.log(versions)
    })
   */
  // get all users;
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
      return devicesModel.find()
        .then((results) => {
          allDevices = results;
          results.forEach((device) => {
            allDeviceIds[device.id] = true;
            if (userIds[device.ownerId] === undefined) {
              unownedDevicesIds[device.id] = true;
            }
            else {
              usedDevices.push(device);
            }
          });
          let unownedAmount = Object.keys(unownedDevicesIds).length;
          console.log("Unowned Devices: ", unownedAmount, 'out of', allDevices.length, ' (',  Math.round((unownedAmount / allDevices.length)*100), '% )')
          // fs.writeFileSync('devices' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json', JSON.stringify(usedDevices, undefined, 2))
        })
    })
    .then(() => {
      return installationModel.find()
        .then((results) => {
          allInstallations = results;
          let toBeDeletedDeviceCount = 0;
          results.forEach((installation) => {
            if (unownedDevicesIds[installation.deviceId] === true) {
              toBeDeletedDeviceCount++;
            }
            if (allDeviceIds[installation.deviceId] === undefined || unownedDevicesIds[installation.deviceId] === true) {
              unownedInstallationIds[installation.id] = true;
            }
          });
          let unownedAmount = Object.keys(unownedInstallationIds).length;
          console.log("Unowned Installations: ", unownedAmount, 'out of', allInstallations.length, ' (',  Math.round((unownedAmount / allInstallations.length)*100), '% ) -- ', toBeDeletedDeviceCount, " of which are in unowned Devices.")
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
      return stoneModel.find()
        .then((results) => {
          allStones = results;
          let toBeDeletedSphereCount = 0;
          results.forEach((stone) => {
            allStoneIds[stone.id] = true;
            if (unownedSphereIds[stone.sphereId] === true) {
              toBeDeletedSphereCount++;
            }
            if (allSphereIds[stone.sphereId] === undefined || unownedSphereIds[stone.sphereId] === true) {
              unownedStoneIds[stone.id] = true;
            }
          });
          let unownedAmount = Object.keys(unownedStoneIds).length;
          console.log("Unowned stones: ", unownedAmount, 'out of', allStones.length,' (',  Math.round((unownedAmount / allStones.length)*100), '% ) -- ', toBeDeletedSphereCount, " of which are in unowned Spheres.")
        })
    })
    .then(() => {
      return locationModel.find()
        .then((results) => {
          allLocations = results;
          let toBeDeletedSphereCount = 0;
          results.forEach((location) => {
            if (unownedSphereIds[location.sphereId] === true) {
              toBeDeletedSphereCount++;
            }
            if (allSphereIds[location.sphereId] === undefined || unownedSphereIds[location.sphereId] === true) {
              unownedLocationIds[location.id] = true;
            }
          });
          let unownedAmount = Object.keys(unownedLocationIds).length;
          console.log("Unowned locations: ", unownedAmount, 'out of', allLocations.length, ' (',  Math.round((unownedAmount / allLocations.length)*100), '% ) -- ', toBeDeletedSphereCount, " of which are in unowned Spheres.")
        })
    })
    .then(() => {
      return appliancesModel.find()
        .then((results) => {
          allAppliances = results;
          let toBeDeletedSphereCount = 0;
          results.forEach((appliance) => {
            if (unownedSphereIds[appliance.sphereId] === true) {
              toBeDeletedSphereCount++;
            }
            if (allSphereIds[appliance.sphereId] === undefined || unownedSphereIds[appliance.sphereId] === true) {
              unownedApplianceIds[appliance.id] = true;
            }
          });
          let unownedAmount = Object.keys(unownedApplianceIds).length;
          console.log("Unowned appliances: ", unownedAmount, 'out of', allLocations.length, ' (',  Math.round((unownedAmount / allLocations.length)*100), '% ) -- ', toBeDeletedSphereCount, " of which are in unowned Spheres.")
        })
    })







    // .then(() => {
    //   if (CHANGE_DATA) {
    //     let idArray = [];
    //     Object.keys(unownedApplianceIds).forEach((id) => { idArray.push({id: id}) });
    //     return appliancesModel.destroyAll({or: idArray})
    //   }
    // })
    // .then(() => {
    //   if (CHANGE_DATA) {
    //     let idArray = [];
    //     Object.keys(unownedLocationIds).forEach((id) => { idArray.push({id: id}) });
    //     return locationModel.destroyAll({or: idArray})
    //   }
    // })
    // .then(() => {
    //   if (CHANGE_DATA) {
    //     let idArray = [];
    //     Object.keys(unownedStoneIds).forEach((id) => { idArray.push({id: id}) });
    //     return stoneModel.destroyAll({or: idArray})
    //   }
    // })
    // .then(() => {
    //   if (CHANGE_DATA) {
    //     let idArray = [];
    //     Object.keys(unownedSphereIds).forEach((id) => { idArray.push({id: id}) });
    //     return sphereModel.destroyAll({or: idArray})
    //   }
    // })
    // .then(() => {
    //   if (CHANGE_DATA) {
    //     let idArray = [];
    //     Object.keys(unownedInstallationIds).forEach((id) => { idArray.push({id: id}) });
    //     return installationModel.destroyAll({or: idArray})
    //   }
    // })
    // .then(() => {
    //   if (CHANGE_DATA) {
    //     let idArray = [];
    //     Object.keys(unownedDevicesIds).forEach((id) => { idArray.push({id: id}) });
    //     return devicesModel.destroyAll({or: idArray})
    //   }
    // })

    // .then(() => {
    //   return powerUsageModel.find()
    //     .then((results) => {
    //       allPowerUsages = results;
    //       let toBeDeletedStoneCount = 0;
    //       results.forEach((point) => {
    //         if (unownedStoneIds[point.stoneId] === true) {
    //           toBeDeletedStoneCount++;
    //         }
    //         if (allStoneIds[point.stoneId] === undefined || unownedStoneIds[point.stoneId] === true) {
    //           unownedPowerUsageIds[point.id] = true;
    //         }
    //       });
    //       let unownedAmount = Object.keys(unownedPowerUsageIds).length;
    //       console.log("Unowned power usage ids: ", unownedAmount, 'out of', allPowerUsages.length, ' (',  Math.round((unownedAmount / allPowerUsages.length)*100), '% ) -- ', toBeDeletedStoneCount, " of which are in unowned Stones.");
    //
    //       // if (allPowerUsages.length > 0 && JSON.parse(JSON.stringify(allPowerUsages[0])).stoneId) {
    //       //   console.warn("Power usage does not show stoneId");
    //       // }
    //       // else if (allPowerUsages.length > 0) {
    //       //   fs.writeFileSync('energyUsage' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json', JSON.stringify(allPowerUsages, undefined, 2))
    //       // }
    //     })
    // })
    // .then(() => {
    //   return energyUsageModel.find()
    //     .then((results) => {
    //       console.log("Got data from energyUsageModel: ", results.length, "hits");
    //       let allEnergyUsages = results;
    //       let toBeDeletedStoneCount = 0;
    //       for (let i = 0; i < results.length; i++) {
    //         let point = results[i];
    //         if (unownedStoneIds[point.stoneId] === true) {
    //           toBeDeletedStoneCount++;
    //         }
    //         if (allStoneIds[point.stoneId] === undefined || unownedStoneIds[point.stoneId] === true) {
    //           unownedEnergyUsageIds[point.id] = true;
    //         }
    //       }
    //       let unownedAmount = Object.keys(unownedEnergyUsageIds).length;
    //       console.log("Unowned energy usage ids: ", unownedAmount, 'out of', allEnergyUsages.length, ' (',  Math.round((unownedAmount / allEnergyUsages.length)*100), '% ) -- ', toBeDeletedStoneCount, " of which are in unowned Stones.");
    //
    //       // if (allEnergyUsages.length > 0 && JSON.parse(JSON.stringify(allEnergyUsages[0])).stoneId) {
    //       //   console.warn("Energy usage does not show stoneId");
    //       // }
    //       // else if (allEnergyUsages.length > 0) {
    //       //   fs.writeFileSync('energyUsage' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json', JSON.stringify(allEnergyUsages, undefined, 2))
    //       // }
    //     })
    // })
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

module.exports = performSanitation;
