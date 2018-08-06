

const fetch = require('node-fetch');
const localConfig = require('../../config.' + (process.env.NODE_ENV || 'local'));
const ToonUtil = require('./ToonUtil')

/**
 *
 "programState": 1  // following the schedule
 "programState": 2  // temporarily different program   --> activeState is the active program
 "programState": -1 // temporarily custom temperature  --> currentSetpoint is the set temperature
 "programState": 4  // holiday mode

 "state": [
 {
   "id": 0, // comfort
   "tempValue": 2000,
   "dhw": 1
 },
 {
   "id": 1, // thuis
   "tempValue": 1800,
   "dhw": 1
 },
 {
   "id": 2, // slaap
   "tempValue": 1500,
   "dhw": 1
 },
 {
   "id": 3, // weg
   "tempValue": 1200,
   "dhw": 1
 },
 {
   "id": 4, // holiday
   "tempValue": 1200,
   "dhw": 1
 },
 {
   "id": 5, // holiday default
   "tempValue": 600,
   "dhw": 1
 }

 * @type {{getAccessToken: (function(*=): Promise<any | never | never>), getSchedule: (function(*, *): Promise<any | never>), parseScheduleFormat: ToonAPI.parseScheduleFormat}}
 */
const ToonAPI = {
  getAccessToken: function(refreshToken) {
    let payload = {
      client_id: localConfig.ToonIntegration.clientId,
      client_secret: localConfig.ToonIntegration.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }
    let headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    let body = objectToBodyString(payload);
    let config = {method: 'POST', headers, body: body};

    return fetch("https://api.toon.eu/token", config)
      .then((res) => {
        return res.json();
      })
      .then((tokens) => {
        return tokens.access_token;
      })
  },

  getSchedule: function(accessToken, agreementId) {
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + accessToken,
    };
    let config = {method: 'GET', headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "/thermostat/programs", config)
      .then((res) => {
        return res.json();
      })
      .then((schedule) => {
        return ToonUtil.parseScheduleFormat(schedule);
      })
  },


  getToonState: function(accessToken, agreementId) {
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + accessToken,
    };
    let config = {method: 'GET', headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "thermostat", config)
      .then((res) => {
        return res.json();
      })
      .then((toonState) => {
        return ToonUtil.parseStateFormat(toonState);
      })
  },


  restoreToonSchedule: function(accessToken, agreementId) {
    let data = {
      "currentSetpoint": 0, // required, but does not matter
      "programState":    1, // turn on the schedule program
      "activeState":     1  // required, but does not matter
    }
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + accessToken,
    };
    let config = {method: 'PUT', body: JSON.stringify(data), headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "thermostat", config)
      .then((res) => {
        return res.json();
      })
      .then((toonState) => {
        return ToonUtil.parseStateFormat(toonState);
      })
  },


  setToonState: function(program, accessToken, agreementId) {
    let data = {
      "currentSetpoint": 0, // required, but does not matter
      "programState":    2, // set the mode to temporary program
      "activeState":     ToonUtil.idMap[program]  // required, but does not matter
    }
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + accessToken,
    };
    let config = {method: 'PUT', body: JSON.stringify(data), headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "thermostat", config)
      .then((res) => {
        return res.json();
      })
      .then((toonState) => {
        return ToonUtil.parseStateFormat(toonState);
      })
  },

  revokeToken: function(accessToken) {
    let payload = {
      client_id: localConfig.ToonIntegration.clientId,
      client_secret: localConfig.ToonIntegration.clientSecret,
      access_token: accessToken
    }
    let headers = {'Content-Type': 'application/x-www-form-urlencoded'};
    let body = objectToBodyString(payload);
    let config = {method: 'POST', headers, body: body};

    return fetch("https://api.toon.eu/revoke", config)
      .catch((err) => { console.log("ToonAPI: Error during revoking", err)})
  },

  /**
   * Expect Crownstone Thermostat Schedule Format as a String.
   * @param scheduleString
   * @returns {boolean}
   */
  getScheduledProgram: function(scheduleString) {
    let currentDate = new Date();
    let scheduleObj = null;
    try {
      scheduleObj = JSON.parse(scheduleString);
    }
    catch (err) {
      LOGe.info("ToonIntegration: Schedule is not a valid json object.")
      return null;
    }

    let day = currentDate.getDay(); // 0 for Sunday, ... 6 Saturday
    let dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

    let hours = currentDate.getHours();
    let minutes = currentDate.getMinutes();

    let minutesSinceMidnight = hours*60 + minutes;

    let scheduleToday = scheduleObj[dayMap[day]];
    for ( let i = 0; i < scheduleToday.length; i++ ) {
      let program = scheduleToday[i];
      if ( minutesSinceMidnight >= (program.start.hour*60 + program.start.minute) && minutesSinceMidnight < (program.end.hour*60 + program.end.minute)) {
        return program;
      }
    }
    return null;
  },


  /**
   * Expect Crownstone Thermostat Schedule Format as a String.
   * @param scheduleString
   * @returns {boolean}
   */
  checkIfScheduleIsAway: function(scheduleString) {
    let program = this.getScheduledProgram(scheduleString);
    if (program && program.program === 'away') {
      return true;
    }
    return false
  },
}


function objectToBodyString(obj) {
  let body = '';
  let keys = Object.keys(obj);
  for (let i = 0; i < keys.length; i++) {
    body += keys[i] + '=' + obj[keys[i]] + '&'
  }
  // strip last &
  return body.substr(0, body.length - 1);
}

module.exports = ToonAPI;

