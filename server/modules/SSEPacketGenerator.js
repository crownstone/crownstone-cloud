module.exports = {
  generateSwitchCronwstoneEvent(stone,sphere,switchState) {
    return {
      type:"command",
      subType: "switchCrownstone",
      sphere:     { id: sphere.id, uid: sphere.uid, name: sphere.name},
      crownstone: { id: stone.id,  uid: stone.uid,  name: sphere.name, switchState: switchState, macAddress: stone.address}
    };
  }
};
