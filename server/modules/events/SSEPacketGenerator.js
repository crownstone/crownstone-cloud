module.exports = {
  generateSwitchCrownstoneEvent(stone,sphere,switchState) {
    return {
      type:       "command",
      subType:    "switchCrownstone",
      sphere:     { id: sphere.id, uid: sphere.uid, name: sphere.name},
      crownstone: { id: stone.id,  uid: stone.uid,  name: stone.name, switchState: switchState, macAddress: stone.address}
    };
  },

  generateSwitchStateUpdatedEvent(stone,sphere,switchState) {
    return {
      type:       "switchStateUpdate",
      subType:    "stone",
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


  // SPHERES //
  generateSphereCreatedEvent(sphere) {
    return {
      type:        "dataChange",
      subType:     "spheres",
      operation:   "create",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: sphere.id, name: sphere.name},
    };
  },
  generateSphereUpdatedEvent(sphere) {
    return {
      type:        "dataChange",
      subType:     "spheres",
      operation:   "update",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: sphere.id, name: sphere.name},
    };
  },
  generateSphereDeletedEvent(sphere) {
    return {
      type:        "dataChange",
      subType:     "spheres",
      operation:   "delete",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: sphere.id, name: sphere.name},
    };
  },

  // USERS //
  generateSphereUserAddedEvent(sphere, user) {
    return {
      type:        "dataChange",
      subType:     "users",
      operation:   "create",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: user.id,   name: user.name},
    };
  },
  generateSphereUserInvitedEvent(sphere, user) {
    return {
      type:        "invitationChange",
      operation:   "invited",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      email:       user.email,
    };
  },
  generateSphereUserInvitationRevokedEvent(sphere, user) {
    return {
      type:        "invitationChange",
      operation:   "invitationRevoked",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      email:       user.email,
    };
  },
  generateSphereUserUpdatedEvent(sphere, user) {
    return {
      type:        "dataChange",
      subType:     "users",
      operation:   "update",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: user.id,   name: user.name},
    };
  },
  generateSphereUserDeletedEvent(sphere, user) {
    return {
      type:        "dataChange",
      subType:     "users",
      operation:   "delete",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: user.id,   name: user.name},
    };
  },

  // STONES //
  generateStoneCreatedEvent(sphere, stone) {
    return {
      type:        "dataChange",
      subType:     "stones",
      operation:   "create",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: stone.id,  name: stone.name},
    };
  },
  generateStoneUpdatedEvent(sphere, stone) {
    return {
      type:        "dataChange",
      subType:     "stones",
      operation:   "update",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: stone.id,  name: stone.name},
    };
  },
  generateStoneDeletedEvent(sphere, stone) {
    return {
      type:        "dataChange",
      subType:     "stones",
      operation:   "delete",
      sphere:      { id: sphere.id, name: sphere.name, uid: sphere.uid},
      changedItem: { id: stone.id,  name: stone.name},
    };
  },

  // Locations //
  generateLocationCreatedEvent(sphere, location) {
    return {
      type:        "dataChange",
      subType:     "location",
      operation:   "create",
      sphere:      { id: sphere.id,   name: sphere.name, uid: sphere.uid},
      changedItem: { id: location.id, name: location.name},
    };
  },
  generateLocationUpdatedEvent(sphere, location) {
    return {
      type:        "dataChange",
      subType:     "location",
      operation:   "update",
      sphere:      { id: sphere.id,   name: sphere.name, uid: sphere.uid},
      changedItem: { id: location.id, name: location.name},
    };
  },
  generateLocationDeletedEvent(sphere, location) {
    return {
      type:        "dataChange",
      subType:     "location",
      operation:   "delete",
      sphere:      { id: sphere.id,   name: sphere.name, uid: sphere.uid},
      changedItem: { id: location.id, name: location.name},
    };
  },
};
