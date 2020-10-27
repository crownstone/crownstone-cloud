const EventConstructor   = require('./EventConstructor');
const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('../SSEManager');


class CommandEventHandler {
  sendStoneMultiSwitch(sphere, stones, switchStateMap) {
    let packet = SSEPacketGenerator.generateMultiSwitchCrownstoneEvent(sphere, stones, switchStateMap);
    SSEManager.emit(packet);
    return packet;
  }
}

module.exports = CommandEventHandler;
