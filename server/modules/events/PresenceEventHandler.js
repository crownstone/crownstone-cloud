const EventConstructor   = require('./EventConstructor');
const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('../SSEManager');



class PresenceEventHandler {

  sendEnterSphere(user, sphere) {
    let packet = SSEPacketGenerator.generateEnterSphereEvent(user, sphere);
    SSEManager.emit(packet)
  }

  sendExitSphere(user, sphere) {
    let packet = SSEPacketGenerator.generateExitSphereEvent(user, sphere);
    SSEManager.emit(packet)
  }

  sendEnterLocation(user, sphere, location) {
    let packet = SSEPacketGenerator.generateEnterLocationEvent(user, sphere, location);
    SSEManager.emit(packet)
  }

  sendExitLocation(user, sphere, location) {
    let packet = SSEPacketGenerator.generateExitLocationEvent(user, sphere, location);
    SSEManager.emit(packet)
  }



  sendEnterSphereFromId(userId, sphereId) {
    EventConstructor.getData({userId, sphereId})
      .then((data) => {
        this.sendEnterSphere(data.user, data.sphere);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }

  sendExitSphereFromId(userId, sphereId) {
    EventConstructor.getData({userId, sphereId})
      .then((data) => {
        this.sendExitSphere(data.user, data.sphere);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }

  sendEnterLocationFromId(userId, sphereId, locationId) {
    EventConstructor.getData({userId, sphereId, locationId})
      .then((data) => {
        this.sendEnterLocation(data.user, data.sphere, data.location);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }

  sendExitLocationFromId(userId, sphereId, locationId) {
    EventConstructor.getData({userId, sphereId, locationId})
      .then((data) => {
        this.sendExitLocation(data.user, data.sphere, data.location);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
}






module.exports = PresenceEventHandler;
