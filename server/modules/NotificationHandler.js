const gcm = require('node-gcm');
const apn = require('apn');

class NotificationHandlerClass {
  constructor() {
    // TODO: possibly start the apn connection and the gcm sender?
  }

  notify(sphereModel) {
    // get users
    // get their notifiable devices
    // base notification purely on Crownstone.consumer for now
    // TODO: get from application model once
    // keys in the format of
//     {
//       apnsToken:`-----BEGIN PRIVATE KEY-----
// x
// ----END PRIVATE KEY-----`,
//       apnsKeyId: 'x',
//       apnsTeamId: 'x',
//       gcmToken: 'x'
//     };

    // notify android
    // notify ios
  }

  _notifyAndroid(keys) {
    // Create a message

    // ... or some given values
    let message = new gcm.Message({
      collapseKey: 'demo',
      priority: 'high',
      contentAvailable: true,
      delayWhileIdle: true,
      timeToLive: 3,
      restrictedPackageName: "somePackageName",
      dryRun: true,
      data: {
        key1: 'message1',
        key2: 'message2'
      },
      notification: {
        title: "Hello, World",
        icon: "ic_launcher",
        body: "This is a notification that will be displayed if your app is in the background."
      }
    });

    // Change the message data
    // ... as key-value
    message.addData('key1', 'message1');
    message.addData('key2', 'message2');

    // ... or as a data object (overwrites previous data object)
    message.addData({
      key1: 'message1',
      key2: 'message2'
    });

    // Set up the sender with you API key
    let sender = new gcm.Sender(keys.gcmToken);

    // Add the registration tokens of the devices you want to send to
    let registrationTokens = ['regToken1'];

    // Send the message
    // ... trying only once
    // sender.sendNoRetry(message, {registrationTokens: registrationTokens}, function (err, response) {
    //   if (err) console.error(err);
    //   else    console.log(response);
    // });

    // ... or retrying
    sender.send(message, {registrationTokens: registrationTokens}, function (err, response) {
      if (err) console.error(err);
      else    console.log(response);
    });

    // ... or retrying a specific number of times (10)
    // sender.send(message, {registrationTokens: registrationTokens}, 10, function (err, response) {
    //   if (err) console.error(err);
    //   else    console.log(response);
    // });
  }

  _notifyIOS(keys) {
    let options = {
      token: {
        key: keys.apnsToken,
        keyId: keys.apnsKeyId,
        teamId: keys.apnsTeamId
      },
      production: false
    };

    let apnProvider = new apn.Provider(options);

    let notification = new apn.Notification();

    notification.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    notification.badge = 3;
    notification.sound = "ping.aiff";
    notification.alert = "\uD83D\uDCE7 \u2709 You have a new message";
    notification.payload = {'messageFrom': 'John Appleseed'};
    notification.topic = "<your-app-bundle-id>";

    // Send the notification to the API with send, which returns a promise.

    let deviceTokens = ["a9d0ed10e9cfd022a61cb08753f49c5a0b0dfb383697bf9f9d750a1003da19c7"];
    apnProvider.send(notification, deviceTokens).then( (result) => {
      // result example:
      // {
      //   "messageFrom": "John Appelseed",
      //   "aps": {"badge": 3, "sound": "ping.aiff", "alert": "\uD83D\uDCE7 \u2709 You have a new message"}
      // }
    });

    // After done: apnProvider.shutDown()
  }

  _notifyEndpoints() {
    // todo: add notification endpoints model slaved to sphere
  }

}

export const NotificationHandler = new NotificationHandlerClass();