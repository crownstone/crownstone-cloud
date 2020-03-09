const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('./SSEManager');
const loopback           = require('loopback');

class EventHandlerClass {

  constructor() {
    this.presence = new PresenceEventHandler();
    this.command  = new CommandEventHandler();
  }

}

class EventConstructor {

  static getStoneData(stoneId) {
    // const StoneModel = loopback.getModel("Stone");
    // return StoneModel.findById(stoneId, {fields: {id: true, name: true, address: true, uid: true, currentSwitchStateId: true}})
  }

  static getSphereData(sphereId) {
    const SphereModel = loopback.getModel("Sphere");
    return SphereModel.findById(sphereId, {fields: {name: true, uid: true}})
      .then((sphere) => {
        if (!sphere) { throw {code: 401, message: "Not available" }; }

        return { id: sphereId, name: sphere.name, uid: sphere.uid }
      })
  }

  static getLocationData(locationId) {
    const LocationModel = loopback.getModel("Location");
    return LocationModel.findById(locationId, {fields: {name: true}})
      .then((location) => {
        if (!location) { throw {code: 401, message: "Not available" }; }

        return { id: locationId, name: location.name }
      })
  }

  static getUserData(userId) {
    const UserModel = loopback.getModel("user");
    return UserModel.findById(userId, {fields: {id: true, firstName: true, lastName: true}})
      .then((user) => {
        if (!user) { throw {code: 401, message: "Not available" }; }

        let userName = null;
        if (!user.firstName) {
          if (!user.lastName) {
            userName = "Anonymous";
          }
          else {
            userName = user.lastName;
          }
        }
        else {
          if (!user.lastName) {
            userName = user.firstName;
          }
          else {
            userName = user.firstName + ' ' + user.lastName;
          }
        }

        return { id: userId, name: userName }
      })
  }

  static getData(options) {
    let result = {};
    let promises = [];

    if (options.userId) {
      promises.push(EventConstructor.getUserData(options.userId).then((userData) => { result["user"] = userData; }));
    }
    if (options.stoneId) {
      promises.push(EventConstructor.getStoneData(options.stoneId).then((stoneData) => { result["stone"] = stoneData; }));
    }
    if (options.sphereId) {
      promises.push(EventConstructor.getSphereData(options.sphereId).then((sphereData) => { result["sphere"] = sphereData; }));
    }
    if (options.locationId) {
      promises.push(EventConstructor.getLocationData(options.locationId).then((locationData) => { result["location"] = locationData; }));
    }

    return Promise.all(promises)
      .then(() => {
        return result;
      })
      .catch((err) => {
        /** do not handle error here, it is up to the handler **/
        throw err;
      })
  }
}


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

class CommandEventHandler {
  sendStoneMultiSwitch(sphere, multiswitchPackets) {

  }

  sendStoneSwitch(stone, switchState, sphere) {
    let packet = SSEPacketGenerator.generateSwitchCrownstoneEvent(stone, sphere, switchState);
    SSEManager.emit(packet);
  }
}




const EventHandler = new EventHandlerClass();

module.exports = EventHandler;
