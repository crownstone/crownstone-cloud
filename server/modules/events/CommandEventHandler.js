const EventConstructor   = require('./EventConstructor');
const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('../SSEManager');


class CommandEventHandler {
  sendStoneMultiSwitchBySphereId(sphereId, stones, switchStateMap) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendStoneMultiSwitch(data.sphere,stones, switchStateMap);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendStoneMultiSwitch(sphere, stones, switchStateMap) {
    let packet = SSEPacketGenerator.generateMultiSwitchCrownstoneEvent(sphere, stones, switchStateMap);
    SSEManager.emit(packet);
    return packet;
  }

  sendStoneSwitch(stone, switchState, sphere) {
    let packet = SSEPacketGenerator.generateSwitchCrownstoneEvent(stone, sphere, switchState);
    SSEManager.emit(packet);
  }
}

module.exports = CommandEventHandler;
