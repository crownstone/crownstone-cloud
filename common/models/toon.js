// "use strict";
const ToonAPI  = require('../../server/integrations/toon/Toon');
const loopback = require('loopback');
const luxon    = require('luxon')

module.exports = function(model) {
  model.validatesUniquenessOf('toonAgreementId', {scopedTo: ['sphereId'], message: 'a Toon with this agreementId was already added!'});

  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__owner');


  function LEGACYcheckIfDevicesArePresent(sphereId, agreementId, ignoreDeviceId) {
    const Sphere = loopback.findModel('Sphere');

    // OLD METHOD
    return Sphere.findById(sphereId)
      .then((sphere) => {
        return sphere.users({include: {relation: 'devices', scope: {include: 'preferences'}}})
      })
      .then((users) => {
        // collect all tokens.
        for (let i = 0; i < users.length; i++) {
          let devices = users[i].devices();
          for ( let j = 0; j < devices.length; j++ ) {
            // skip the ID we should ignore.
            if (devices[j].id === ignoreDeviceId) { continue; }

            let preferences = devices[j].preferences();
            for (let k = 0; k < preferences.length; k++) {
              if (preferences[k].property === 'toon_enabled_agreementId.' + agreementId && preferences[k].value == true) {
                if (devices[k].currentSphereId === sphereId) {
                  // devices that are expecting us to keep them warm are still in the Sphere.
                  return true;
                }
              }
            }
          }
        }

        // nobody here!
        return false;
      })
  }

  function checkIfDevicesArePresent(sphereId, agreementId, ignoreDeviceId) {
    const sphereMapModel  = loopback.getModel("DeviceSphereMap");
    const preferenceModel = loopback.getModel("Preference");

    return sphereMapModel.find({where: {sphereId: sphereId}})
      .then((results) => {
        let deviceIds = [];
        // these are the devices in the sphere.
        for (let i = 0; i < results.length; i++) {
          if (results[i].deviceId !== ignoreDeviceId) {
            deviceIds.push([results[i].deviceId]);
          }
        }

        let preferenceKey = 'toon_enabled_agreementId.' + agreementId;
        let preferenceQueryPart = {};
        preferenceQueryPart[preferenceKey] = true;

        // search for preferences where one of these devices has this Toon enabled
        return preferenceModel.find({where: {and: [{deviceId: {inq: deviceIds}}, preferenceQueryPart]}})
      })
      .then((results) => {
        if (results.length > 0) {
          return true;
        }
        return false;
      })
  }

  function JOINEDcheckIfDevicesArePresent(sphereId, agreementId, ignoreDeviceId) {
    return checkIfDevicesArePresent(sphereId, agreementId, ignoreDeviceId)
      .then((result) => {
        if (result === false) {
          return LEGACYcheckIfDevicesArePresent(sphereId, agreementId, ignoreDeviceId);
        }
        return true;
      })
  }



  model.setToonProgram = function(toonId, targetProgram, ignoreDeviceId, next) {
    if (targetProgram !== 'away' && targetProgram !== 'home') { return next("Only away and home are valid programs."); }

    let accessTokens = null;
    let toon = null;
    model.findById(toonId)
      .then((storedToon) => {
        if (!storedToon) { throw {message:"No Toon found with this ID.", code: "TOON_NOT_FOUND"}}

        toon = storedToon;

        let scheduledProgram = ToonAPI.getScheduledProgram(toon.schedule);
        let timestampOfStartProgram = luxon.DateTime.fromObject({hour:scheduledProgram.start.hour, minute:scheduledProgram.start.minute, zone: "Europe/Amsterdam"}).toMillis()

        if (scheduledProgram.program !== 'away') {
          throw {message:"Toon's scheduled program is not 'away' at the moment. We can only change it if the schedule is set to 'away'.", code: "STATE_IS_NOT_AWAY"};
        }

        if (targetProgram === 'home') {
          // we have not changed the program yet after the start of this scheduled AWAY slot..
          if (toon.changedProgramTime === 0 || toon.changedProgramTime > 0 && toon.changedProgramTime < timestampOfStartProgram || toon.changedToProgram !== 'home') {
            // continue with the state change, we do not need to worry about other users to stay warm!
            return false;
          }
          else {
            throw {message:"Toon's currently scheduled program has already been changed by Crownstone.", code: "ALREADY_CHANGED"};
          }
        }
        else {
          // targetProgram === 'away'
          if (toon.changedToProgram !== 'away') {
            // check if there are people we would leave in the cold
            return JOINEDcheckIfDevicesArePresent(toon.sphereId, toon.toonAgreementId, ignoreDeviceId);
          }
          else {
            throw {message:"Toon's program should already be 'away'. If it is not, a user has changed this and we will not override it.", code: "ALREADY_ON_AWAY"};
          }
        }
      })
      .then((usersAreStillPresent) => {
        if (usersAreStillPresent === false) {
          return ToonAPI.getAccessToken(toon.refreshToken, toon.id)
        }
        else {
          throw {message:"There are still people in the Sphere. We cannot just turn off the heating!.", code: "PEOPLE_STILL_THERE"};
        }
      })
      .then((newAccessTokens) => {
        accessTokens = newAccessTokens;
        toon.refreshToken            = accessTokens.refreshToken;
        toon.refreshTokenTTL         = accessTokens.refreshTokenTTL;
        toon.refreshTokenUpdatedAt   = accessTokens.refreshTokenUpdatedAt;
        toon.refreshTokenUpdatedFrom = accessTokens.refreshTokenUpdatedFrom + "_setToonProgram";
        toon.save();
        return ToonAPI.getToonState(accessTokens, toon.toonAgreementId);
      })
      .then((toonState) => {
        // it's already on the desired target! We do not need to do anything.
        if (toonState.currentProgram === targetProgram) { return; }

        if (targetProgram === 'home' && toonState.scheduleActive === true) {
          // DO IT!
          return ToonAPI.setToonState('home', accessTokens, toon.toonAgreementId)
        }
        else if (targetProgram === 'home' && toonState.scheduleActive !== true) {
          throw {message:"Toon is not following it's schedule at the moment. We will not override manual user input.", code: "SCHEDULE_DISABLED"};
        }
        else if (targetProgram === 'away' && toonState.currentProgram === 'home' && toonState.scheduleActive === false) {
          // DO IT!
          return ToonAPI.restoreToonSchedule(accessTokens, toon.toonAgreementId)
        }
        else {
          // target == away
          if (toonState.scheduleActive === true) {
            throw {message:"Toon is following a schedule. We only set the program to 'away' if we have set it to 'home' before.", code: "SCHEDULE_ENABLED"};
          }
          else {
            throw {message:"Toon not set to 'home', so we won't change it to 'away'.", code: "STATE_IS_NOT_HOME"};
          }
        }
      })
      .then(() => {
        toon.changedToProgram = targetProgram;
        toon.changedProgramTime = new Date().valueOf();
        return toon.save();
      })
      .then(() => {
        next(null, toon);
      })
      .catch((err) => {
        if (typeof err === "object" && err.message && err.code) {
          next({"statusCode": 405, "message": err.message, "errorCode": err.code, model: toon});
        }
        else {
          next(err);
        }
      })
  }

  model.remoteMethod(
    'setToonProgram',
    {
      http: {path: '/:id/setProgram', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'program', type: 'string', required: true, http: { source : 'query' }},
        {arg: 'ignoreDeviceId', type: 'string', required: false, http: { source : 'query' }},
      ],
      returns: {arg: 'data', type: 'Toon', root: true},
      description: 'Set a program on the Toon. Possible programs: [away, home]'
    }
  );


  model.updateSchedule = function(toonId, next) {
    let toon;
    let schedule;
    model.findById(toonId)
      .then((storedToon) => {
        if (!storedToon) {
          throw {message: "No Toon found with this ID.", code: "TOON_NOT_FOUND"}
        }

        toon = storedToon;

        return ToonAPI.getAccessToken(toon.refreshToken);
      })
      .then((receivedTokens) => {
        toon.refreshToken            = receivedTokens.refreshToken;
        toon.refreshTokenTTL         = receivedTokens.refreshTokenTTL;
        toon.refreshTokenUpdatedAt   = receivedTokens.refreshTokenUpdatedAt;
        toon.refreshTokenUpdatedFrom = receivedTokens.refreshTokenUpdatedFrom + "_updateSchedule";
        return ToonAPI.getSchedule(receivedTokens, toon.toonAgreementId);
      })
      .then((receivedSchedule) => {
        schedule = receivedSchedule;
        toon.schedule = JSON.stringify(receivedSchedule);
        toon.updatedScheduleTime = new Date().valueOf();
        return toon.save()
      })
      .then(() => {
        next(null, toon);
      })
      .catch((err) => {
        if (typeof err === "object" && err.message && err.code) {
          next({"statusCode": 405, "message": err.message, "errorCode": err.code, model: toon});
        }
        else {
          next(err);
        }
        return toon.save()
      })
  }

  model.remoteMethod(
    'updateSchedule',
    {
      http: {path: '/:id/updateSchedule', verb: 'post'},
      accepts: [
        {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
      ],
      returns: {arg: 'data', type: 'Toon', root: true},
      description: 'Force an update of the Toon schedule. This is normally done by the cloud once a day, but if you just changed your schedule on the Toon you can refresh it with this.'
    }
  );

};
