const EventConstructor   = require('./EventConstructor');
const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('../SSEManager');


class CommandEventHandler {
  sendStoneMultiSwitch(sphere, stones, switchStateMap) {
    let packet = SSEPacketGenerator.generateMultiSwitchCrownstoneEvent(sphere, stones, switchStateMap);
    SSEManager.emit(packet);
  }

  sendStoneSwitch(stone, switchState, sphere) {
    let packet = SSEPacketGenerator.generateSwitchCrownstoneEvent(stone, sphere, switchState);
    SSEManager.emit(packet);
  }
}







module.exports = CommandEventHandler;
