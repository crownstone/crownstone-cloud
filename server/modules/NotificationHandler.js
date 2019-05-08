const gcm = require('node-gcm');
const apn = require('apn');
let loopback = require('loopback');

/**
 *  This class will handle the sending of notifications. API:
 *
 *  messageData: {
 *    data: { any },  // there has to be a command in here and all data required to do something with the notification.
 *    silent: boolean,
 *    type:  string   // type of notification ['setSwitchStateRemotely','message', ...]
 *    title: string   // title of the notification.
 *  }
 *
 *  Provide a sphereId, or a sphere object to notify the hubs, a list of user objects or a list of user ids
 */
class NotificationHandlerClass {
  constructor() {
    // TODO: possibly start the apn connection and the gcm sender?
  }

  collectSphereUsers(sphereId) {
    let sphereAccessModel = loopback.getModel("SphereAccess");
    return sphereAccessModel.find({where: {and: [{sphereId: sphereId}, {invitePending: false}]},fields: "userId"})
      .then((userIds) => {
        let result = [];
        userIds.forEach((userData) => {
          result.push(String(userData.userId))
        })
        return result;
      })

  }

  notifyDevice(device, messageData) {
    let installations = device.installations();
    let {iosTokens, iosDevTokens, androidTokens} = getTokensFromInstallations(installations, {},{},{})

    // check if we have to do something
    this.notifyTokens(iosTokens, iosDevTokens, androidTokens, messageData);
  }

  notifySphereUsers(sphereId, messageData) {
    this.collectSphereUsers(sphereId)
      .then((userIdArray) => {
        if (userIdArray && Array.isArray(userIdArray)) {
          this.notifyUserIds(userIdArray, messageData);
        }
      });
  }

  notifySphereDevices(sphere, messageData) {
    // get users
    sphere.users({include: {relation: 'devices', scope: {include: 'installations'}}}, (err, users) => {
      let {iosTokens, iosDevTokens, androidTokens} = getTokensFromUsers(users)

      // check if we have to do something
      this.notifyTokens(iosTokens, iosDevTokens, androidTokens, messageData);
    });
  }

  notifyTokens(iosTokens, iosDevTokens, androidTokens, messageData) {
    if (iosTokens.length > 0 || iosDevTokens.length > 0 || androidTokens.length > 0) {
      // get app, currently hardcoded.
      loopback.getModel("App").findOne({where: {name: 'Crownstone.consumer'}})
        .then((appResult) => {
          if (appResult && appResult.pushSettings) {
            // console.log("Sending notification", messageData)
            this._notifyAndroid(appResult.pushSettings.gcm, androidTokens, messageData);
            this._notifyIOS(appResult.pushSettings.apns,    iosTokens, iosDevTokens, messageData);
          }
          else {
            throw "No App to Push to."
          }
        })
        .catch((err) => { console.log("error during notify", err)})
    }
  }

  notifyUserIds(userIds, messageData) {
    let userIdArray = [];
    for (let i = 0; i < userIds.length; i++) {
      userIdArray.push({id:userIds[i]});
    }
    this._notifyUsers(userIdArray, messageData);
  }

  notifyUsers(arrayOfUserObjects, messageData) {
    let userIdArray = [];
    for (let i = 0; i < arrayOfUserObjects.length; i++) {
      userIdArray.push({id:arrayOfUserObjects[i].id});
    }

    this._notifyUsers(userIdArray, messageData);
  }

  _notifyUsers(userIdArray, messageData) {
    if (userIdArray.length === 0) {
      return;
    }

    let userModel = loopback.getModel('user');
    let filter = {where: {or:userIdArray}, include: {relation: 'devices', scope: {include: 'installations'}}};
    userModel.find(filter, (err, users) => {
      let {iosTokens, iosDevTokens, androidTokens} = getTokensFromUsers(users)
      // check if we have to do something
      this.notifyTokens(iosTokens, iosDevTokens, androidTokens, messageData);
    });
  }


  /**
   * Notify all android devices
   * @param keys      // { serverApiKey: 'xxxxxxx' }
   * @param tokens    // array of tokens
   * @param messageData    // JSON
   * @private
   */
  _notifyAndroid(keys, tokens, messageData = {}) {
    if (tokens.length === 0) {
      return;
    }

    let message = new gcm.Message({
      collapseKey: messageData.title,
      priority: 'high',
      data: messageData.data,
    });

    // Set up the sender with you API key
    let sender = new gcm.Sender(keys.serverApiKey);


    // Add the registration tokens of the devices you want to send to
    sender.send(message, {registrationTokens: tokens}, function (err, response) {
      if (err) {
        // console.log('ANDROID ERROR PUSH', err);
      }
      else {
        // console.log("ANDROID PUSH RESPONSE", response);
      }
    });

  }


  /**
   * Notify all IOS devices
   * @param keys      // {
   *                  //   keyToken: "-----BEGIN PRIVATE KEY-----\n<token here>\n-----END PRIVATE KEY-----',
                      //   keyId: 'xx',
                      //   teamId: 'xx'
                      // }
   * @param tokens    // array of tokens
   * @param messageData  JSON
   * @private
   */
  _notifyIOS(keys, tokens, devTokens, messageData = {}) {
    let options = {
      token: {
        key: keys.keyToken,
        keyId: keys.keyId,
        teamId: keys.teamId
      },
      production: false
    };

    if (tokens.length > 0)  {
      options.production = true;
      this._sendIOSNotifications(tokens,options,messageData);
    }

    if (devTokens.length > 0)  {
      options.production = false;
      this._sendIOSNotifications(devTokens,options,messageData);
    }
  }

  _sendIOSNotifications(tokens, options, messageData) {
    let apnProvider = new apn.Provider(options);

    let notification = new apn.Notification();

    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    notification.badge = messageData.badge || 0;    // 0 = remove badge
    notification.payload = messageData.data;
    notification.topic = 'com.crownstone.Crownstone';

    let silent = messageData.silent;
    if (messageData.silentIOS !== undefined) {
      silent = messageData.silentIOS;
    }

    if (silent) {
      // add this for silent push
      notification.contentAvailable = true;
    }
    else {
      notification.sound = "ping.aiff";       // do not add if no sound should play
      notification.body =  messageData.type;  // alert message body, do not add if no alert has to be shown.
      notification.alert = messageData.title || 'Notification Received'; // alert message, do not add if no alert has to be shown.
    }

    // Send the notification to the API with send, which returns a promise.
    // console.log("sending this notificaiton", notification)
    apnProvider.send(notification, tokens)
      .then((result) => {
        // console.log("IOS PUSH RESULT", JSON.stringify(result, undefined,2));
      })
      .then(() => {
        apnProvider.shutdown()
      })
      .catch((err) => {
        // console.log("ERROR DURING PUSH!", err)
      })
  }

  _notifyEndpoints() {
    // todo: add notification endpoints model slaved to sphere
  }

}


function getTokensFromInstallations(installations, iosUniqueTokens, iosDevUniqueTokens, androidUniqueTokens) {
  let iosTokens = [];
  let iosDevTokens = [];
  let androidTokens = [];

  for (let k = 0; k < installations.length; k++) {
    let token = installations[k].deviceToken;
    if (token) {
      switch (installations[k].deviceType) {
        case 'ios':
          if (installations[k].developmentApp === true) {
            if (iosDevUniqueTokens[token] === undefined) {
              iosDevUniqueTokens[token] = true;
              iosDevTokens.push(token);
            }
          }
          else if (iosUniqueTokens[token] === undefined) {
            iosUniqueTokens[token] = true;
            iosTokens.push(token);
          }
          break;
        case 'android':
          if (androidUniqueTokens[token] === undefined) {
            androidUniqueTokens[token] = true;
            androidTokens.push(token);
          }
          break;
      }
    }
  }

  return {iosTokens, iosDevTokens, androidTokens}
}

function getTokensFromUsers(users) {
  // get users
  let total_iosTokens = [];
  let total_iosDevTokens = [];
  let total_androidTokens = [];

  let iosUniqueTokens = {};
  let iosDevUniqueTokens = {};
  let androidUniqueTokens = {};

  // collect all tokens.
  for (let i = 0; i < users.length; i++) {
    let devices = users[i].devices();
    for (let j = 0; j < devices.length; j++) {
      let installations = devices[j].installations();
      let {iosTokens, iosDevTokens, androidTokens} = getTokensFromInstallations(installations, iosUniqueTokens, iosDevUniqueTokens, androidUniqueTokens);
      total_iosTokens     = total_iosTokens.concat(iosTokens);
      total_iosDevTokens  = total_iosDevTokens.concat(iosDevTokens);
      total_androidTokens = total_androidTokens.concat(androidTokens);
    }
  }

  return {
    iosTokens: total_iosTokens,
    iosDevTokens: total_iosDevTokens,
    androidTokens: total_androidTokens
  }
}



module.exports = new NotificationHandlerClass();




