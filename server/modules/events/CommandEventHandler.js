const EventConstructor   = require('./EventConstructor');
const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('../SSEManager');


class CommandEventHandler {
  sendStoneMultiSwitch(sphere, multiswitchPackets) {

  }

  sendStoneSwitch(stone, switchState, sphere) {
    let packet = SSEPacketGenerator.generateSwitchCrownstoneEvent(stone, sphere, switchState);
    SSEManager.emit(packet);
  }
}







module.exports = CommandEventHandler;
