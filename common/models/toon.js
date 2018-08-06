// "use strict";

module.exports = function(model) {


  model.validatesUniquenessOf('toonAgreementId', {scopedTo: ['sphereId'], message: 'a Toon with this agreementId was already added!'});

  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__owner');

  model.setToonProgram = function(toonId, targetProgram, ignoreDeviceId, next) {
    if (targetProgram !== 'away' && targetProgram !== 'home') { return next("Only away and home are valid programs."); }

    let accessToken = null;
    let toon = null;
    model.findById(toonId)
      .then((storedToon) => {
        if (!storedToon) { throw("No Toon found with this id.")}

        toon = storedToon;

        let scheduledProgram = ToonAPI.getScheduledProgram(toon.schedule);
        let timestampOfStartProgram = new Date(new Date().setHours(scheduledProgram.start.hour)).setMinutes(scheduledProgram.start.minute)

        if (scheduledProgram.program !== 'away') {
          throw "Toon's scheduled program is not 'away' at the moment. We can only change it if the schedule is set to 'away'.";
        }

        if (targetProgram === 'home') {
          // we have not changed the program yet after the start of this scheduled AWAY slot..
          if (toon.changedProgramTime > 0 || toon.changedProgramTime < timestampOfStartProgram) {
            // check state to change!
            return ToonAPI.getAccessToken(toon.refreshToken)
          }
          else {
            throw "Toon's currently scheduled program has already been changed by Crownstone.";
          }
        }
        else {
          // targetProgram === 'away'
          if (toon.changedToProgram === 'home') {
            // check state to change!
            return ToonAPI.getAccessToken(toon.refreshToken)
          }
          else {
            throw "Toon's program should already be 'away'. If it is not, a user has changed this and we will not override it.";
          }
        }
      })
      .then((newAccessToken) => {
        accessToken = newAccessToken;
        return ToonAPI.getToonState(accessToken);
      })
      .then((toonState) => {
        // it's already on the desired target! We do not need to do anything.
        if (toonState.currentProgram === targetProgram) { return; }

        if (targetProgram === 'home' && toonState.scheduleActive === true) {
          // DO IT!
          return ToonAPI.setToonState('home', accessToken, toon.toonAgreementId)
        }
        else if (targetProgram === 'home' && toonState.scheduleActive !== true) {
          throw "Toon is not following it's schedule at the moment. We will not override manual user input.";
        }
        else if (targetProgram === 'away' && toonState.currentProgram !== 'home' && toonState.scheduleActive === false) {
          // DO IT!
          return ToonAPI.restoreToonSchedule(accessToken, toon.toonAgreementId)
        }
        else {
          if (toonState.scheduleActive === true) {
            throw "Toon is following a schedule. We only set the program to 'away' if we have set it to 'home' before.";
          }
          else {
            throw "Toon not set to 'home', so we won't change it to 'away'.";
          }
        }
      })
      .then(() => {
        toon['changedToProgram'] = targetProgram;
        toon['changedProgramTime'] = new Date().valueOf();
        return toon.save();
      })
      .then(() => {
        next(null, toon);
      })
      .catch((err) => {
        next(err);
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
};
