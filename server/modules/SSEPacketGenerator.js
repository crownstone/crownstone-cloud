module.exports = {
  generateSwitchCrownstoneEvent(stone,sphere,switchState) {
    return {
      type:       "command",
      subType:    "switchCrownstone",
      sphere:     { id: sphere.id, uid: sphere.uid, name: sphere.name},
      crownstone: { id: stone.id,  uid: stone.uid,  name: stone.name, switchState: switchState, macAddress: stone.address}
    };
  },

  generateEnterSphereEvent(user, sphere) {
    return {
      type:     "presence",
      subType:  "enterSphere",
      sphere:   { id: sphere.id, name: sphere.name, uid: sphere.uid},
      user:     { id: user.id,   name: user.name },
    };
  },

  generateExitSphereEvent(user, sphere) {
    return {
      type:     "presence",
      subType:  "exitSphere",
      sphere:   { id: sphere.id, name: sphere.name, uid: sphere.uid},
      user:     { id: user.id,   name: user.name },
    };
  },

  generateEnterLocationEvent(user, sphere, location) {
    return {
      type:     "presence",
      subType:  "enterLocation",
      sphere:   { id: sphere.id,   name: sphere.name, uid: sphere.uid},
      location: { id: location.id, name: location.name },
      user:     { id: user.id,     name: user.name },
    };
  },

  generateExitLocationEvent(user, sphere, location) {
    return {
      type:     "presence",
      subType:  "exitLocation",
      sphere:   { id: sphere.id,   name: sphere.name, uid: sphere.uid},
      location: { id: location.id, name: location.name },
      user:     { id: user.id,     name: user.name },
    };
  },
};
