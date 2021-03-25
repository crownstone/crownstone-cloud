"use strict";

const loopback = require('loopback');
const app = require('../../../server/server');

const authorizationError = {
  statusCode: 401,
  name: "Error",
  message: "Authorization Required",
  code: "AUTHORIZATION_REQUIRED"
};

const accessTypes = {
  admin: 'admin',
  installer: 'installer',
  viewer: 'viewer'
}

module.exports = function(model) {

  if (app.get('acl_enabled')) {
    model.disableRemoteMethodByName('find');

    //***************************
    // GENERAL:
    //   - nothing
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$everyone",
        "permission": "DENY"
      }
    );

    //***************************
    // AUTHENTICATED:
    //   - create new sphere
    //***************************
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$authenticated",
        "permission": "ALLOW",
        "property": "create"
      }
    );

    //***************************
    // ADMIN:
    //   - everything
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:admin",
        "permission": "ALLOW"
      }
    );

    //***************************
    // Viewer:
    //   - TODO
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:viewer",
        "permission": "DENY"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$project:viewer",
        "permission": "ALLOW",
        "property": "getInfo"
      }
    );

    //***************************
    // Installer:
    //   - TODO
    //***************************
    model.settings.acls.push(
      {
        "accessType": "*",
        "principalType": "ROLE",
        "principalId": "$project:installer",
        "permission": "ALLOW"
      }
    );
  }


  model.disableRemoteMethodByName('create');
  model.disableRemoteMethodByName('replaceOrCreate');
  model.disableRemoteMethodByName('patchOrCreate');
  model.disableRemoteMethodByName('exists');
  model.disableRemoteMethodByName('findById');
  model.disableRemoteMethodByName('find');
  model.disableRemoteMethodByName('findOne');
  model.disableRemoteMethodByName('destroyById');
  model.disableRemoteMethodByName('deleteById');
  model.disableRemoteMethodByName('count');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('createChangeStream');
  model.disableRemoteMethodByName('updateAll');
  model.disableRemoteMethodByName('replaceOrCreate');
  model.disableRemoteMethodByName('replaceById');
  model.disableRemoteMethodByName('prototype.patchAttributes');
  model.disableRemoteMethodByName('patchById');
  model.disableRemoteMethodByName('upsertWithWhere');
  model.disableRemoteMethodByName('prototype.__get__owner');


  model.reportRepairedCrownstone = function(subProjectId, number, options, callback) {
    model.findById(subProjectId)
      .then((subProject) => {
        let totalPrepared = subProject.totalNumberOfPreparedCrownstones;
        let target = subProject.totalNumberOfCrownstones;
        let diff = totalPrepared - target;
        let broken = subProject.numberOfFailedCrownstones;
        if ((broken-number) < diff) {
          throw "Cannot mark Crownstone as repaired if all extra Crownstones are already prepared.";
        }
        subProject.numberOfFailedCrownstones = subProject.totalNumberOfPreparedCrownstones - number;
        return subProject.save();
      })
      .then(() => { callback(null); })
      .catch((err) => { callback(err); })
  }

  model.reportFailedCrownstone = function(subProjectId, number, options, callback) {
    model.findById(subProjectId)
      .then((subProject) => {
        subProject.numberOfFailedCrownstones = subProject.numberOfFailedCrownstones + number;
        return subProject.save();
      })
      .then(() => { callback(null); })
      .catch((err) => { callback(err); })
  }

  model.remoteMethod(
    'reportFailedCrownstone',
    {
      http: {path: '/:id/reportFailedCrownstone', verb: 'put'},
      accepts: [
        {arg: 'id',                        type: 'any', required: true, http: { source : 'path' }},
        {arg: 'numberOfFailedCrownstones', type: 'any', required: true, http: { source : 'query' }},
        {arg: "options",                   type: "object", http: "optionsFromRequest"},
      ],
      description: "Method called to increment the number of FAILED Crownstones with the provided number.",
      returns: {arg: 'data', type: 'SubProject', root: true},
    }
  );

  model.remoteMethod(
    'reportRepairedCrownstone',
    {
      http: {path: '/:id/reportRepairedCrownstone', verb: 'put'},
      accepts: [
        {arg: 'id',                        type: 'any', required: true, http: { source : 'path' }},
        {arg: 'numberOfRepairedCrownstones', type: 'any', required: true, http: { source : 'query' }},
        {arg: "options",                   type: "object", http: "optionsFromRequest"},
      ],
      description: "Method called to increment the number of FAILED Crownstones with the provided number.",
      returns: {arg: 'data', type: 'SubProject', root: true},
    }
  );

  const authorizeUser = function(currentUserId, subProjectId, installationToken) {
    const ProjectAccessModel = loopback.getModel("ProjectAccess");
    const DeviceModel = loopback.getModel("Device");
    let subProject = null;
    return model.findById(subProjectId)
      .then((subProjectResult) => {
        subProject = subProjectResult
        return ProjectAccessModel.findOne({where: {and: [{userId: currentUserId}, {projectId: subProject.projectId}]}})
      })
      .then((result) => {
        if (!result) { throw authorizationError; }

        if (result.role === accessTypes.admin) {
          // get the keys for the admin.
        }
        else if (result.role === accessTypes.installer) {
          // get devices from installer to check if the provided installation ID exists. This ID lives on the app and in the cloud. It cannot be gotten manually without hacking into the app database.
          return DeviceModel.findOne({where: {ownerId: currentUserId}, fields:{id: true, installations:true}, include: {relation:"installations",scope:{where: {installationToken: installationToken}, fields:{id: true}}}})
            .then((result) => {
              if (result.length === 0)                  { throw authorizationError; }
              if (result[0].installations.length === 0) { throw authorizationError; }

              let totalPrepared = subProject.totalNumberOfPreparedCrownstones;
              let target = subProject.totalNumberOfCrownstones;
              let diff = totalPrepared - target;
              let broken = subProject.numberOfFailedCrownstones;
              if (totalPrepared < target) {
                throw "Not all Crownstones have been prepared. Access denied."
              }
              if (diff === broken) {
                throw "Cannot setup more Crownstones, the amount of prepared Crownstones matches the total required amount plus the failed Crownstones. Add to failed Crownstones before setup is allowed.";
              }
            })
        }
        else {
          throw authorizationError;
        };
      })
  }


  model.performCloudSideSetupAndGetData = function(subProjectId, installationToken, crownstoneType, macAddress, switchCraft, options, callback) {
    const SphereModel = loopback.getModel("Sphere");
    const StoneModel = loopback.getModel("Stone");
    const StoneKeyModel = loopback.getModel("StoneKeys");
    let currentUserId = options && options.accessToken && options.accessToken.userId;
    let subProject = null;
    let sphere = null;
    let stone = null;
    let stoneKeys = null;

    let stoneCreated = false;
    let numbersIncremented = false;

    authorizeUser(currentUserId, subProjectId, installationToken)
      .then(() => {
        // user has access
        return model.findById(subProjectId);
      })
      .then((subProjectResult) => {
        subProject = subProjectResult;
        return SphereModel.findById(subProject.sphereId);
      })
      .then((sphereResult) => {
        sphere = sphereResult;
        return StoneModel.create({address: macAddress, type: crownstoneType, icon: 'c2-crownstone', addedBySubProject: true});
      })
      .then((stoneResult) => {
        stone = stoneResult;
        stoneCreated = true;
        return StoneKeyModel.find({where: {and: [{sphereId: sphere.id}, {stoneId: stone.id}]}});
      })
      .then((keyResult) => {
        stoneKeys = keyResult;
        subProject.totalNumberOfPreparedCrownstones = subProject.totalNumberOfPreparedCrownstones + 1;
        if (switchCraft) {
          subProject.numberOfPreparedSwitchcraft = subProject.numberOfPreparedSwitchcraft + 1;
        }
        return subProject.save();
      })
      .then(() => {
        numbersIncremented = true;
        let setupData = {
          sphereKeys: JSON.parse(subProject.sphereKeys),
          sphereUid: sphere.uid,
          sphereIBeaconUUID: sphere.uuid,
          stoneIBeaconMajor: stone.major,
          stoneIBeaconMinor: stone.minor,
          stoneUid: stone.uid,
          stoneNetworkKey: stoneKeys[0].key,
        }

        callback(null, setupData);
      })
      .catch((err) => {
        if (stoneCreated) {
          // delete it again
          StoneModel.destroyById(stone.id);
        }
        if (numbersIncremented) {
          subProject.totalNumberOfPreparedCrownstones = subProject.totalNumberOfPreparedCrownstones - 1;
          if (switchCraft) {
            subProject.numberOfPreparedSwitchcraft = subProject.numberOfPreparedSwitchcraft - 1;
          }
          subProject.save();
        }
        callback(err);
      })
      .catch((err) => {
        callback(err);
      })
  }

  model.undoCloudSideSetup = function(subProjectId, installationToken, crownstoneUID, switchcraft, options, callback) {
    let currentUserId = options && options.accessToken && options.accessToken.userId;
    const StoneModel  = loopback.getModel("Stone");
    let subProject;
    authorizeUser(currentUserId, subProjectId, installationToken)
      .then(() => {
        // user has access
        return model.findById(subProjectId);
      })
      .then((projectResult) => {
        subProject = projectResult;
        return StoneModel.find({where: {and: [{uid: crownstoneUID}, {sphereId: subProject.sphereId}]}})
      })
      .then((stoneResult) => {
        if (stoneResult.length !== 0) {
          if (stoneResult[0].addedBySubProject) {
            return StoneModel.destroyById(stoneResult[0].id);
          }
          else {
            throw authorizationError;
          }
        }
      })
      .then(() => {
        subProject.totalNumberOfPreparedCrownstones = subProject.totalNumberOfPreparedCrownstones - 1;
        if (switchCraft) {
          subProject.numberOfPreparedSwitchcraft = subProject.numberOfPreparedSwitchcraft - 1;
        }
        return subProject.save();
      })
      .then(() => { callback(null); })
      .catch((err) => { callback(err); })
  }

  model.remoteMethod(
    'performCloudSideSetupAndGetData',
    {
      http: {path: '/:id/performCloudSideSetupAndGetData', verb: 'post'},
      accepts: [
        {arg: 'id',                type: 'any', required: true,  http: { source : 'path' }},
        {arg: 'installationToken', type: 'any', required: false, http: { source : 'query' }},
        {arg: 'crownstoneType',    type: 'any', required: true,  http: { source : 'query' }},
        {arg: 'macAddress',        type: 'any', required: true,  http: { source : 'query' }},
        {arg: 'switchCraft',       type: 'any', required: true,  http: { source : 'query' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      description: "Request data required for preparing Crownstones.",
      returns: {arg: 'data', type: 'any', root: true},
    }
  );

  model.remoteMethod(
    'undoCloudSideSetup',
    {
      http: {path: '/:id/undoCloudSideSetup', verb: 'post'},
      accepts: [
        {arg: 'id',                type: 'any', required: true,  http: { source : 'path' }},
        {arg: 'installationToken', type: 'any', required: false, http: { source : 'query' }},
        {arg: 'crownstoneUID',     type: 'any', required: true,  http: { source : 'query' }},
        {arg: 'switchCraft',       type: 'any', required: true,  http: { source : 'query' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      description: "Undo the cloud side setup that was done by a call to performCloudSideSetupAndGetData. This will remove the Crownstone from the subProject.",
      returns: {arg: 'data', type: 'any', root: true},
    }
  );

  model.remoteMethod(
    'markAsFinished',
    {
      http: {path: '/:id/markAsFinished', verb: 'post'},
      accepts: [
        {arg: 'id',                type: 'any', required: true, http: { source : 'path' }},
        {arg: 'areYouSure',        type: 'any', required: true, http: { source : 'path' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      description: "Finalize and deliver the subproject after installation. Are you sure requires 'YES'"
    }
  );


  model.getInfo = function(id, options, callback) {
    const ProjectAccessModel = loopback.getModel("ProjectAccess");
    let currentUserId = options && options.accessToken && options.accessToken.userId;
    let subProject;
    model.findById(id)
      .then((subProjectResult) => {
        subProject = subProjectResult
        return ProjectAccessModel.findOne({where: {and: [{userId: currentUserId}, {projectId: subProject.projectId}]}})
      })
      .then((result) => {
        if (!result) { throw authorizationError; }

        let allowServiceDataKey = false;
        if (result.role === accessTypes.admin) {
          // get the keys for the admin.
          allowServiceDataKey = true;
        }
        else if (result.role === accessTypes.installer) {
          allowServiceDataKey = true;
        }

        let keys = JSON.parse(subProject.sphereKeys);
        let reply = {
          name:                              subProject.name,
          information:                       subProject.information,
          status:                            subProject.status,
          finishedDate:                      subProject.finishedDate,
          installDate:                       subProject.installDate,
          shortId:                           subProject.shortId,
          totalNumberOfCrownstones:          subProject.totalNumberOfCrownstones,
          totalNumberOfInstalledCrownstones: subProject.totalNumberOfInstalledCrownstones,
          totalNumberOfPreparedCrownstones:  subProject.totalNumberOfPreparedCrownstones,
          numberOfSwitchcraft:               subProject.numberOfSwitchcraft,
          numberOfPreparedSwitchcraft:       subProject.numberOfPreparedSwitchcraft,
          numberOfInstalledSwitchcraft:      subProject.numberOfInstalledSwitchcraft,
          numberOfFailedCrownstones:         subProject.numberOfFailedCrownstones,
        };
        if (allowServiceDataKey) {
          reply.serviceDataKey = keys['SERVICE_DATA_KEY'];
        }
        callback(null, reply);
      })
      .catch((err) => { callback(err); })
  }

  model.remoteMethod(
    'getInfo',
    {
      http: {path: '/:id', verb: 'get'},
      accepts: [
        {arg: 'id',                type: 'any', required: true, http: { source : 'path' }},
        {arg: "options",           type: "object", http: "optionsFromRequest"},
      ],
      returns: {arg: 'data', type: 'SubProject', root: true},
      description: "Get information on this subproject."
    }
  );



}
