module.exports = {
  generateSwitchCrownstoneEvent(stone,sphere,switchState) {
    return {
      type:       "command",
      subType:    "switchCrownstone",
      sphere:     sphereData(sphere),
      crownstone: crownstoneData(stone, switchState)
    };
  },
  generateMultiSwitchCrownstoneEvent(sphere, stones, switchStateMap) {
    let stoneData = [];
    for (let i = 0; i < stones.length; i++) {
      let csData = crownstoneData(stones[i], switchStateMap[stones[i].id].switchState)
      csData.type = switchStateMap[stones[i].id].type;
      stoneData.push(csData);
    }

    return {
      type:        "command",
      subType:     "multiSwitch",
      sphere:      sphereData(sphere),
      switchData:  stoneData
    };
  },

  generateSwitchStateUpdatedEvent(stone,sphere,switchState) {
    return {
      type:       "switchStateUpdate",
      subType:    "stone",
      sphere:     sphereData(sphere),
      crownstone: crownstoneData(stone, switchState)
    };
  },


  generateEnterSphereEvent(user, sphere) {
    return {
      type:     "presence",
      subType:  "enterSphere",
      sphere:   sphereData(sphere),
      user:     userData(user),
    };
  },

  generateExitSphereEvent(user, sphere) {
    return {
      type:     "presence",
      subType:  "exitSphere",
      sphere:   sphereData(sphere),
      user:     userData(user),
    };
  },

  generateEnterLocationEvent(user, sphere, location) {
    return {
      type:     "presence",
      subType:  "enterLocation",
      sphere:   sphereData(sphere),
      location: locationData(location),
      user:     userData(user),
    };
  },

  generateExitLocationEvent(user, sphere, location) {
    return {
      type:     "presence",
      subType:  "exitLocation",
      sphere:   sphereData(sphere),
      location: locationData(location),
      user:     userData(user),
    };
  },


  // SPHERES //
  generateSphereCreatedEvent(sphere) {
    return {
      type:        "dataChange",
      subType:     "spheres",
      operation:   "create",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(sphere),
    };
  },
  generateSphereUpdatedEvent(sphere) {
    return {
      type:        "dataChange",
      subType:     "spheres",
      operation:   "update",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(sphere),
    };
  },
  generateSphereDeletedEvent(sphere) {
    return {
      type:        "dataChange",
      subType:     "spheres",
      operation:   "delete",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(sphere),
    };
  },

  // USERS //
  generateSphereUserAddedEvent(sphere, user) {
    return {
      type:        "dataChange",
      subType:     "users",
      operation:   "create",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(user),
    };
  },
  generateSphereUserInvitedEvent(sphere, user) {
    return {
      type:        "invitationChange",
      operation:   "invited",
      sphere:      sphereData(sphere),
      email:       user.email,
    };
  },
  generateSphereUserInvitationRevokedEvent(sphere, user) {
    return {
      type:        "invitationChange",
      operation:   "invitationRevoked",
      sphere:      sphereData(sphere),
      email:       user.email,
    };
  },
  generateSphereUserUpdatedEvent(sphere, user) {
    return {
      type:        "dataChange",
      subType:     "users",
      operation:   "update",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(user),
    };
  },
  generateSphereUserDeletedEvent(sphere, user) {
    return {
      type:        "dataChange",
      subType:     "users",
      operation:   "delete",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(user),
    };
  },
  generateSphereTokensUpdatedEvent(sphere) {
    return {
      type:        "sphereTokensChanged",
      subType:     "sphereAuthorizationTokens",
      operation:   "update",
      sphere:      sphereData(sphere),
    };
  },

  // STONES //
  generateStoneCreatedEvent(sphere, stone) {
    return {
      type:        "dataChange",
      subType:     "stones",
      operation:   "create",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(stone),
    };
  },
  generateStoneUpdatedEvent(sphere, stone) {
    return {
      type:        "dataChange",
      subType:     "stones",
      operation:   "update",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(stone),
    };
  },
  generateStoneDeletedEvent(sphere, stone) {
    return {
      type:        "dataChange",
      subType:     "stones",
      operation:   "delete",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(stone),
    };
  },
  generateAbilityChangeEvent(sphere, stone, ability) {
    return {
      type:        "abilityChange",
      subType:     ability.type,
      sphere:      sphereData(sphere),
      stone:       crownstoneData(stone),
      ability:     abilityData(ability)
    };
  },

  // Locations //
  generateLocationCreatedEvent(sphere, location) {
    return {
      type:        "dataChange",
      subType:     "location",
      operation:   "create",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(location),
    };
  },
  generateLocationUpdatedEvent(sphere, location) {
    return {
      type:        "dataChange",
      subType:     "location",
      operation:   "update",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(location),
    };
  },
  generateLocationDeletedEvent(sphere, location) {
    return {
      type:        "dataChange",
      subType:     "location",
      operation:   "delete",
      sphere:      sphereData(sphere),
      changedItem: nameIdSet(location),
    };
  },
};


function sphereData( sphere )     { return { id: String(sphere.id), name: sphere.name, uid: sphere.uid }; }
function locationData( location ) { return nameIdSet(location); }
function userData( user )         { return nameIdSet(user); }
function nameIdSet( item )        { return { id: String(item.id), name: item.name}; }
function abilityData( ability )   { return { type: ability.type, enabled: ability.enabled, syncedToCrownstone: ability.syncedToCrownstone }; }
function crownstoneData( stone, switchState )  {
  return { id: String(stone.id),  uid: stone.uid,  name: stone.name, switchState: switchState === undefined ? null : switchState, macAddress: stone.address };
}
