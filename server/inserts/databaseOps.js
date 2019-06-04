"use strict";
const fs = require("fs");
const { ask, promiseBatchPerformer } = require("./insertUtil");
const crypto = require("crypto")


let CHANGE_DATA = false;
let DELETE_TIMESERIES = false;

function performDatabaseOperations(app) {
  Promise.resolve()
    .then(() => { return insertSphereUids(app);   })
    .then(() => { return insertLocationUids(app); })
}


function insertSphereUids(app) {
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let sphereCounter = 0
  let candidates = 0;
  console.log("----------- Starting insertSphereUids ------------");
  let doIt = function() {
    return sphereModel.find()
      .then((results) => {
        let promises = []
        sphereCounter = results.length;
        results.forEach((sphere) => {
          if (!sphere.uid) {
            candidates++;
            if (CHANGE_DATA === true) {
              sphere.uid = crypto.randomBytes(1)[0];
              promises.push(sphere.save());
            }
          }

        })
        return Promise.all(promises)
      })
      .then(() => {
        if (CHANGE_DATA !== true) {
          console.log("Because change data is false nothing was changed. I would have added a UID to ", candidates, " out of ", sphereCounter, " Spheres.")
        } else {
          console.log("FINISHED")
        }
      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO ADD UIDS TO ALL SPHERES? Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt()
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for adding uids to spheres. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt()
  }

}

function insertLocationUids(app) {
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let locationModel = app.dataSources.mongoDs.getModel('Location');

  console.log("----------- Starting insertLocationUids ------------");

  let locationCounter = 0
  let sphereCounter = 0

  let doIt = function() {
    return sphereModel.find()
      .then((results) => {
        let promises = []
        results.forEach((sphere) => {
          let sphereNumber = sphereCounter++
          promises.push(new Promise((resolve, reject) => {
            let sphereLocationToUpdateCounter = 0
            let sphereLocationCount = 0
            locationModel.find({where: {sphereId: sphere.id}})
              .then((locations) => {
                let savePromises = [];
                sphereLocationCount = locations.length;
                let locationUids = {};
                for (let i = 0; i < locations.length; i++) {
                  let location = locations[i];
                  if (!location.uid) {
                    locationCounter++
                    sphereLocationToUpdateCounter++
                  }
                  else {
                    locationUids[location.uid] = true;
                  }
                }

                if (sphereLocationToUpdateCounter > 0) {
                  for (let i = 0; i < locations.length; i++) {
                    let location = locations[i];
                    if (!location.uid) {
                      if (CHANGE_DATA === true) {
                        location.uid = getAvailableId(locationUids);
                        savePromises.push(location.save());
                      }
                    }
                  }
                }
                return Promise.all(savePromises)
              })
              .then(() => {
                if (sphereLocationCount > 0 && sphereLocationToUpdateCounter > 0) {
                  if (CHANGE_DATA) {
                    console.log("LocationUID finished for Sphere", sphereNumber, ". Updating", sphereLocationToUpdateCounter, "out of", sphereLocationCount, "Locations.")
                  }
                  else {
                    console.log("LocationUID finished for Sphere", sphereNumber, ". Would have done", sphereLocationToUpdateCounter, "out of", sphereLocationCount, "Locations.")
                  }
                }
                resolve()
              })
              .catch((err) => {
                console.log("ERROR", err)
              })
            })
          )
        })
        return Promise.all(promises)
      })
      .then(() => {
        if (CHANGE_DATA !== true) {
          console.log("Because change data is false nothing was changed. I would have added a UID to ", locationCounter, " locations in ", sphereCounter, " Spheres.")
        }
        else {
          console.log("FINISHED")
        }
      })
  }

  if (CHANGE_DATA === true) {
    return ask("Database Operations: DO YOU WANT TO ADD UIDS TO ALL LOCATIONS? Continue? (YES/NO)")
      .then((answer) => {
        if (answer === 'YES') {
          console.log("STARTING OPERATION")
          return doIt()
        }
        else {
          return new Promise((resolve, reject) => {
            reject("User permission denied for adding uids to locations. Restart script and type YES to continue.")
          });
        }
      })
  }
  else {
    return doIt()
  }
}

function getAvailableId(map) {
  for (let i = 1; i <= 64; i++) {
    if (map[i] === undefined) {
      map[i] = true;
      return i;
    }
  }
}

function powerusageRun(app) {
  console.log("Starting Database Operations run");

  let userModel = app.dataSources.mongoDs.getModel('user');
  let sphereModel = app.dataSources.mongoDs.getModel('Sphere');
  let locationModel = app.dataSources.mongoDs.getModel('Location');
  let stoneModel = app.dataSources.mongoDs.getModel('Stone');
  let devicesModel = app.dataSources.mongoDs.getModel('Device');
  let installationModel = app.dataSources.mongoDs.getModel('AppInstallation');
  let appliancesModel = app.dataSources.mongoDs.getModel('Appliance');
  let powerUsageModel = app.dataSources.mongoDs.getModel('PowerUsage');
  let energyUsageModel = app.dataSources.mongoDs.getModel('EnergyUsage');

  powerUsageModel.definition.settings.hidden = [];
  energyUsageModel.definition.settings.hidden = [];

  let allPowerUsages = [];
  let allEnergyUsages = [];

  let backedUpPowerUsage = false;
  let backedUpEnergyUsage = false;

  console.log("Getting Power usage...");
  new Promise((resolve, reject) => resolve())
    .then(() => {
      return powerUsageModel.find();
    })
    .then((results) => {
      console.log("Got data from powerUsageModel: ", results.length, "hits");
      allPowerUsages = results;
      if (allPowerUsages.length > 0 && !JSON.parse(JSON.stringify(allPowerUsages[0])).stoneId) {
        console.warn("Power usage does not show stoneId");
      }
      else if (allPowerUsages.length > 0) {
        console.log("Writing backup for power usage to disk.");
        let path = './backup/powerUsage_backup_' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json';
        if (fs.existsSync(path) === false) {
          fs.writeFileSync(path, JSON.stringify(allPowerUsages, undefined, 2));
          backedUpPowerUsage = true;
          console.log("Writing backup for power usage to disk. DONE.");
        }
        else {
          return new Promise((resolve, reject) => { reject("File " + path + " already exists! Aborting...")});
        }
      }
    })
    .then(() => {
      if (CHANGE_DATA) {
        if (DELETE_TIMESERIES && backedUpPowerUsage) {
          return new Promise((resolve, reject) => {
            ask("Database Operations: power usage has been backup-ed. Delete power usage data in the database. Continue? (YES/NO)")
              .then((answer) => {
                if (answer === 'YES') {
                  // return powerUsageModel.destroyAll();
                }
                else {
                  return new Promise((resolve, reject) => { reject("User permission denied for deleting power usage data during Database operations. Restart script and type YES to continue.") });
                }
              })
          })
        }
        else if (DELETE_TIMESERIES) {
          return new Promise((resolve, reject) => {
            reject("Could not create backups of power usage. Data will not be removed from server. Aborting...")
          });
        }
      }
    })
    .then(() => {
      console.log("Getting Energy usage...");
      return energyUsageModel.find()
        .then((results) => {
          console.log("Got data from energyUsageModel: ", results.length, "hits");
          let allEnergyUsages = results;

          if (allEnergyUsages.length > 0 && !JSON.parse(JSON.stringify(allEnergyUsages[0])).stoneId) {
            console.warn("Energy usage does not show stoneId");
          }
          else if (allEnergyUsages.length > 0) {
            console.log("Writing backup for energy usage to disk.");
            let path = './backup/energyUsage_backup_' + new Date().getFullYear() + '-' + (new Date().getMonth()+1) + '-' +  new Date().getDate() + '.json';
            if (fs.existsSync(path) === false) {
              fs.writeFileSync(path, JSON.stringify(allEnergyUsages, undefined, 2));
              backedUpEnergyUsage = true;
              console.log("Writing backup for energy usage to disk. DONE.");
            }
            else {
              return new Promise((resolve, reject) => { reject("File " + path + " already exists! Aborting...")});
            }
          }
        })
    })
    .then(() => {
      if (CHANGE_DATA) {
        if (DELETE_TIMESERIES && backedUpEnergyUsage) {
          return new Promise((resolve, reject) => {
            ask("Database Operations: energy usage has been backup-ed. Delete energy usage data in the database. Continue? (YES/NO)")
              .then((answer) => {
                if (answer === 'YES') {
                  // return energyUsageModel.destroyAll();
                }
                else {
                  return new Promise((resolve, reject) => {
                    reject("User permission denied for deleting energy usage data during Database operations. Restart script and type YES to continue.")
                  });
                }
              })
          })
        }
        else if (DELETE_TIMESERIES) {
          return new Promise((resolve, reject) => {
            reject("Could not create backups of energy usage. Data will not be removed from server. Aborting...")
          });
        }
      }
    })
    .then(() => {
      console.log("performDatabaseOperations, DONE");
      if (backedUpPowerUsage && backedUpEnergyUsage) {
        console.log("All energy and power data has been backup-ed.");
        if (DELETE_TIMESERIES && CHANGE_DATA) {
          console.log("Energy and Power data have been removed from the cloud server.");
        }
      }
    })
    .catch((err) => {
      console.log("Error during performDatabaseOperations:", err);
    })
}



module.exports = performDatabaseOperations;
