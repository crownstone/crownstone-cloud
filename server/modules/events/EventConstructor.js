const loopback = require('loopback');


class EventConstructor {

  static getStoneData(stoneId) {
    const StoneModel = loopback.getModel("Stone");
    const SwitchStateModel = loopback.getModel("SwitchState");
    let data = {};
    return StoneModel.findById(stoneId, {fields: {id: true, name: true, address: true, uid: true, currentSwitchStateId: true}})
      .then((stone) => {
        if (!stone) { throw {code: 401, message: "Not available" }; }
        data = { id: stoneId, name: stone.name, address: stone.address, uid: stone.uid, switchState: null }
        return SwitchStateModel.findById(stone.currentSwitchStateId, {fields: { switchState : true }})
      })
      .then((switchState) => {
        if (switchState) {
          data.switchState = switchState.switchState;
        }
        return data;
      })
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


module.exports = EventConstructor;
