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
    let sphereModel = loopback.getModel("Sphere");
    return sphereModel.findById(sphereId)
      .then((sphere) => {
        if (sphere) {
          return new Promise((resolve, reject) => {
            sphere.users({fields: {id:true}}, (err, userIdArray) => {
              if (!err && userIdArray.length > 0) {
                return resolve(userIdArray);
              }
            })
          })
        }
      })

  }

  notifySphereUsers(sphereId, messageData) {
    this.collectSphereUsers(sphereId)
      .then((userIdArray) => {
        if (userIdArray && Array.isArray(userIdArray)) {
          this.notifyUsers(userIdArray, messageData);
        }
      });
  }

  notifyHubs(sphere, messageData) {
    // get users
    let iosTokens = [];
    let androidTokens = [];

    let iosUniqueTokens = {};
    let androidUniqueTokens = {};

    sphere.users({include: {relation: 'devices', scope: {include: 'installations'}}}, (err, users) => {
      // collect all tokens.
      for (let i = 0; i < users.length; i++) {
        let devices = users[i].devices();
        for (let j = 0; j < devices.length; j++) {
          if (devices[j].hubFunction === true) {
            let installations = devices[j].installations();
            for (let k = 0; k < installations.length; k++) {
              let token = installations[k].deviceToken;
              if (token) {
                switch (installations[k].deviceType) {
                  case 'ios':
                    if (iosUniqueTokens[token] === undefined) {
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
          }
        }
      }

      // check if we have to do something
      if (iosTokens.length > 0 || androidTokens.length > 0) {
        // get app, currently hardcoded.
        loopback.getModel("App").findOne({where: {name: 'Crownstone.consumer'}})
          .then((appResult) => {
            if (appResult && appResult.pushSettings) {
              this._notifyAndroid(appResult.pushSettings.gcm, androidTokens, messageData);
              this._notifyIOS(appResult.pushSettings.apns, iosTokens, messageData);
            }
            else {
              throw "No App to Push to."
            }
          })
      }
    });
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
    // get users
    let iosTokens = [];
    let androidTokens = [];

    let iosUniqueTokens = {};
    let androidUniqueTokens = {};

    let userModel = loopback.getModel('user');
    let filter = {where: {or:userIdArray}, include: {relation: 'devices', scope: {include: 'installations'}}};
    userModel.find(filter, (err, users) => {
      // collect all tokens.
      for (let i = 0; i < users.length; i++) {
        let devices = users[i].devices();
        for (let j = 0; j < devices.length; j++) {
          let installations = devices[j].installations();
          for (let k = 0; k < installations.length; k++) {
            let token = installations[k].deviceToken;
            if (token) {
              switch (installations[k].deviceType) {
                case 'ios':
                  if (iosUniqueTokens[token] === undefined) {
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
        }
      }
      // console.log('iosTokens', iosTokens, 'androidTokens', androidTokens);

      // check if we have to do something
      if (iosTokens.length > 0 || androidTokens.length > 0) {
        // get app, currently hardcoded.
        loopback.getModel("App").findOne({where: {name: 'Crownstone.consumer'}})
          .then((appResult) => {
            if (appResult && appResult.pushSettings) {
              this._notifyAndroid(appResult.pushSettings.gcm, androidTokens, messageData);
              this._notifyIOS(appResult.pushSettings.apns, iosTokens, messageData);
            }
            else {
              throw "No App to Push to."
            }
          })
      }
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
  _notifyIOS(keys, tokens, messageData = {}) {
    if (tokens.length === 0) {
      return;
    }

    let production = true;
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
      production = false;
    }

    // console.log("USING PRODUCTION FOR NOTIFICATIONS", production)

    let options = {
      token: {
        key: keys.keyToken,
        keyId: keys.keyId,
        teamId: keys.teamId
      },
      production: production
    };

    let apnProvider = new apn.Provider(options);

    let notification = new apn.Notification();

    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    notification.badge = messageData.badge || 0;    // 0 = remove badge
    notification.payload = messageData.data;
    notification.topic = 'com.crownstone.Crownstone';

    let silent = messageData.silent;
    if (messageData.silentIOS !== undefined) {
      silent = messageData.silent;
    }

    if (silent) {
      // add this for silent push
      notification.contentAvailable = true;
    }
    else {
      notification.sound = "ping.aiff";             // do not add if no sound should play
      notification.body =  messageData.type;        // alert message body, do not add if no alert has to be shown.
      notification.alert = messageData.title || 'Notification Received'; // alert message, do not add if no alert has to be shown.
    }

    // Send the notification to the API with send, which returns a promise.
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

module.exports = new NotificationHandlerClass();




