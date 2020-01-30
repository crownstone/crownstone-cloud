const SSEPacketGenerator = require('./SSEPacketGenerator')
const SSEManager         = require('./SSEManager')

class EventHandlerClass {

  constructor() {
    this.presence = new PresenceEventHandler();
    this.command  = new CommandEventHandler();
  }

}

class EventConstructor {

  _getStoneData(stoneId) {

  }

  _getSphereData(sphereId) {

  }

  _getLocationData(locationId) {

  }

  _getUserData(userId) {

  }
}


class PresenceEventHandler extends EventConstructor {

  sendEnterSphere(user, sphere) {

  }
  sendExitSphere(user, sphere) {

  }
  sendExitLocation(user, sphere, location) {

  }
  sendEnterLocation(user, sphere, location) {

  }
}

class CommandEventHandler extends EventConstructor {
  sendStoneMultiSwitch(sphere, multiswitchPackets) {

  }

  sendStoneSwitch(stone, switchState, sphere) {
    let packet = SSEPacketGenerator.generateSwitchCronwstoneEvent(stone, sphere, switchState);
    SSEManager.emit(packet);
  }
}




const EventHandler = new EventHandlerClass();

module.exports = EventHandler;
