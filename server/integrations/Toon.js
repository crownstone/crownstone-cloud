

const fetch = require('node-fetch');
const localConfig = require('../config.' + (process.env.NODE_ENV || 'local'));


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

  parseScheduleFormat: function(toonSchedule) {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    let internalSchedule = {};

    let idMap = {
      0: 'comfort',
      1: 'thuis',
      2: 'slaap',
      3: 'weg'
    }


    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      let day = days[dayIndex];
      internalSchedule[day] = [];
      for (let j = 0; j < toonSchedule.length; j++) {
        let entry = toonSchedule[j];
        if (entry.startDayOfWeek === dayIndex) {
          if (entry.endDayOfWeek === dayIndex) {
            internalSchedule[day].push({start: {hour:entry.startHour, minute: entry.endHour}, end: {hour:entry.endHour, minute: entry.endMin}, program: idMap[entry.targetState.id], temperature: entry.targetState.tempValue})
          }
          else {
            internalSchedule[day].push({start: {hour:entry.startHour, minute: entry.endHour}, end: {hour:23, minute: 59}, program: idMap[entry.targetState.id], temperature: entry.targetState.tempValue})
          }
        }
        else if (entry.endDayOfWeek === dayIndex) {
          internalSchedule[day].push({start: {hour:0, minute: 0}, end: {hour:entry.endHour, minute: entry.endMin}, program: idMap[entry.targetState.id], temperature: entry.targetState.tempValue})
        }
      }
      internalSchedule[day].sort((a,b) => { return (a.start.hour*60 + a.start.minute) - (b.start.hour*60 + b.start.minute)})
    }

    return internalSchedule;
  }

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

/** CLOUD SCHEDULE FORMAT
 *
 * [
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 0,
    "startHour": 10,
    "startMin": 0,
    "endDayOfWeek": 0,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 0,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 0,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 0,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 1,
    "endHour": 7,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 1,
    "startHour": 7,
    "startMin": 0,
    "endDayOfWeek": 1,
    "endHour": 8,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 1,
    "startHour": 8,
    "startMin": 0,
    "endDayOfWeek": 1,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 3,
      "tempValue": 1200,
      "dhw": 3,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 1,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 1,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 1,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 2,
    "endHour": 7,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 2,
    "startHour": 7,
    "startMin": 0,
    "endDayOfWeek": 2,
    "endHour": 8,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 2,
    "startHour": 8,
    "startMin": 0,
    "endDayOfWeek": 2,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 3,
      "tempValue": 1200,
      "dhw": 3,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 2,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 2,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 2,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 3,
    "endHour": 7,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 3,
    "startHour": 7,
    "startMin": 0,
    "endDayOfWeek": 3,
    "endHour": 8,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 3,
    "startHour": 8,
    "startMin": 0,
    "endDayOfWeek": 3,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 3,
      "tempValue": 1200,
      "dhw": 3,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 3,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 3,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 3,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 4,
    "endHour": 7,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 4,
    "startHour": 7,
    "startMin": 0,
    "endDayOfWeek": 4,
    "endHour": 8,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 4,
    "startHour": 8,
    "startMin": 0,
    "endDayOfWeek": 4,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 3,
      "tempValue": 1200,
      "dhw": 3,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 4,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 4,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 4,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 5,
    "endHour": 7,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 5,
    "startHour": 7,
    "startMin": 0,
    "endDayOfWeek": 5,
    "endHour": 8,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 5,
    "startHour": 8,
    "startMin": 0,
    "endDayOfWeek": 5,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 3,
      "tempValue": 1200,
      "dhw": 3,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 5,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 5,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 5,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 6,
    "endHour": 7,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 6,
    "startHour": 7,
    "startMin": 0,
    "endDayOfWeek": 6,
    "endHour": 18,
    "endMin": 0,
    "targetState": {
      "id": 1,
      "tempValue": 1800,
      "dhw": 1,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 6,
    "startHour": 18,
    "startMin": 0,
    "endDayOfWeek": 6,
    "endHour": 23,
    "endMin": 0,
    "targetState": {
      "id": 0,
      "tempValue": 2000,
      "dhw": 0,
      "tempState": 0
    }
  },
 {
    "type": "weekly_recurring",
    "startDayOfWeek": 6,
    "startHour": 23,
    "startMin": 0,
    "endDayOfWeek": 0,
    "endHour": 10,
    "endMin": 0,
    "targetState": {
      "id": 2,
      "tempValue": 1500,
      "dhw": 2,
      "tempState": 0
    }
  }
 ]
 */
