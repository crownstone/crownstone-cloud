
const loopback = require('loopback');

let configRequiredPostfix = process.env.NODE_ENV;
if (configRequiredPostfix === 'test') { process.env.NODE_ENV = 'local' }

const luxon       = require('luxon')
const fetch       = require('node-fetch');
const localConfig = require('../../config.' + (process.env.NODE_ENV || 'local'));
const ToonUtil    = require('./ToonUtil')

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
  getAccessToken: function(refreshToken, toonId = null) {
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
        if (tokens.refresh_token === undefined) {
          throw {message:"We have not received a token from the TOON cloud.", code: "NO_TOKEN_RECEIVED"};
        }
        let tokenData = {
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          toonId: toonId,
        }
        return tokenData;
      })
  },

  getSchedule: function(tokens, agreementId) {
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + tokens.accessToken,
    };
    let config = {method: 'GET', headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "/thermostat/programs", config)
      .then((res) => {
        return ToonAPI.verifyResult(res, tokens, (tokenData) => { return ToonAPI.getSchedule(tokenData, agreementId)});
      })
      .then((schedule) => {
        return ToonUtil.parseScheduleFormat(schedule);
      })
  },


  getToonState: function(tokens, agreementId) {
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + tokens.accessToken,
    };
    let config = {method: 'GET', headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "/thermostat", config)
      .then((res) => {
        return ToonAPI.verifyResult(res, tokens, (tokenData) => { return ToonAPI.getToonState(tokenData, agreementId)});
      })
      .then((toonState) => {
        return ToonUtil.parseStateFormat(toonState);
      })
  },


  restoreToonSchedule: function(tokens, agreementId) {
    let data = {
      "currentSetpoint": 0, // required, but does not matter
      "programState":    1, // turn on the schedule program
      "activeState":     1  // required, but does not matter
    }
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + tokens.accessToken,
    };
    let config = {method: 'PUT', body: JSON.stringify(data), headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "/thermostat", config)
      .then((res) => {
        return ToonAPI.verifyResult(res, tokens, (tokenData) => { return ToonAPI.restoreToonSchedule(tokenData, agreementId)});
      })
      .then((toonState) => {
        return ToonUtil.parseStateFormat(toonState);
      })
  },


  setToonState: function(program, tokens, agreementId) {
    let data = {
      "currentSetpoint": 0, // required, but does not matter
      "programState":    2, // set the mode to temporary program
      "activeState":     ToonUtil.idMapInverse[program]  // required, but does not matter
    }
    let headers = {
      'content-type': 'application/json',
      'cache-control': 'no-cache',
      'authorization': 'Bearer ' + tokens.accessToken,
    };
    let config = {method: 'PUT', body: JSON.stringify(data), headers};
    return fetch("https://api.toon.eu/toon/v3/" + agreementId + "/thermostat", config)
      .then((res) => {
        return ToonAPI.verifyResult(res, tokens, (tokenData) => { return ToonAPI.setToonState(program, tokenData, agreementId)});
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
    let currentDate = luxon.DateTime.local().setZone("Europe/Amsterdam")
    let scheduleObj = null;
    try {
      scheduleObj = JSON.parse(scheduleString);
    }
    catch (err) {
      LOGe.info("ToonIntegration: Schedule is not a valid json object.")
      return null;
    }

    let day = currentDate.weekday - 1; //  1 is Monday and 7 is Sunday, -1 makes 0 monday and 6 sunday, like this array
    let dayMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    let hours = currentDate.hour;
    let minutes = currentDate.minute;

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


  verifyResult(res, tokens, retryCallback) {
    let toonCloudReply;
    return res.json()
      .then((receivedToonCloudReply) => {
        toonCloudReply = receivedToonCloudReply;
        if (toonCloudReply.fault && typeof toonCloudReply.fault === 'object' &&
            toonCloudReply.fault.detail && typeof toonCloudReply.fault.detail === 'object') {
          if (
            toonCloudReply.fault.detail.errorcode === "keymanagement.service.access_token_expired" ||
            toonCloudReply.fault.detail.errorcode === "keymanagement.service.invalid_access_token") {
            return ToonAPI.checkForTokenRepair(tokens)
          }
          throw toonCloudReply;
        }
        return true;
      })
      .then((tokens) => {
        // there is no problem if this is true
        if (tokens === true) {
          return toonCloudReply;
        }
        // alternatively, tokens is a new tokens object.
        else {
          return retryCallback(tokens)
        }
      })

  },

  checkForTokenRepair(tokensUsedInRequest) {
    let refreshToken = tokensUsedInRequest.refreshToken;
    const Toon = loopback.findModel('Toon');
    let toon, tokens;
    return Toon.findById(tokensUsedInRequest.toonId)
      .then((foundToon) => {
        if (!foundToon) {
          throw {message:"The access token has expired and we could not get a new one...", code: "INVALID_TOKEN"};
        }
        else {
          toon = foundToon;
          return ToonAPI.getAccessToken(refreshToken, tokensUsedInRequest.toonId)
        }
      })
      .then((receivedTokens) => {
        tokens = receivedTokens;
        tokens.toonId = tokensUsedInRequest.toonId;
        if (toon.refreshToken === tokens.refreshToken) {
          throw {message:"The access token has expired and refreshing it did not help...", code: "INVALID_TOKEN"};
        }
        toon.refreshToken = tokens.refreshToken;
        return toon.save();
      })
      .then(() => {
        return receivedTokens;
      })
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

