const EventConstructor   = require('./EventConstructor');
const SSEPacketGenerator = require('./SSEPacketGenerator');
const SSEManager         = require('../SSEManager');


class DataChangeEventHandler {
  // SPHERES //
  sendSphereCreatedEvent(sphere) {
    let packet = SSEPacketGenerator.generateSphereCreatedEvent(sphere);
    SSEManager.emit(packet)
  }
  sendSphereUpdatedEvent(sphere) {
    let packet = SSEPacketGenerator.generateSphereUpdatedEvent(sphere);
    SSEManager.emit(packet)
  }
  sendSphereDeletedEvent(sphere) {
    let packet = SSEPacketGenerator.generateSphereDeletedEvent(sphere);
    SSEManager.emit(packet)
  }

  // USERS //

  // ----- USERS CREATE ----- //
  sendSphereUserCreatedEventById(sphereId, userId) {
    return EventConstructor.getData({userId, sphereId})
      .then((data) => {
        this.sendSphereUserCreatedEvent(data.sphere, data.user);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendSphereUserCreatedEvent(sphere, user) {
    let packet = SSEPacketGenerator.generateSphereUserAddedEvent(sphere, user);
    SSEManager.emit(packet)
  }

  // ----- USERS INVITED ----- //
  sendSphereUserInvitedEventById(sphereId, email) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendSphereUserInvitedEvent(data.sphere,{email: email});
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendSphereUserInvitedEvent(sphere, user) {
    let packet = SSEPacketGenerator.generateSphereUserInvitedEvent(sphere, user);
    SSEManager.emit(packet)
  }

  // ----- USERS INVITE REVOKED ----- //
  sendSphereUserInvitationRevokedEventById(sphereId, email) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendSphereUserInvitationRevokedEvent(data.sphere, {email: email});
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendSphereUserInvitationRevokedEvent(sphere, user) {
    let packet = SSEPacketGenerator.generateSphereUserInvitationRevokedEvent(sphere, user);
    SSEManager.emit(packet)
  }


  // ----- USERS UPDATE ----- //
  sendSphereUserUpdatedEventById(sphereId, userId) {
    return EventConstructor.getData({userId, sphereId})
      .then((data) => {
        this.sendSphereUserUpdatedEvent(data.sphere, data.user);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendSphereUserUpdatedEvent(sphere, user) {
    let packet = SSEPacketGenerator.generateSphereUserUpdatedEvent(sphere, user);
    SSEManager.emit(packet)
  }

  // ----- USERS DELETE ----- //
  sendSphereUserDeletedEvent(sphere, user) {
    let packet = SSEPacketGenerator.generateSphereUserDeletedEvent(sphere, user);
    SSEManager.emit(packet)
  }




  // STONES //
  // ----- STONES CREATE ----- //
  sendStoneCreatedEventBySphereId(sphereId, stone) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendStoneCreatedEvent(data.sphere, stone);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/
      })
  }
  sendStoneCreatedEvent(sphere, stone) {
    let packet = SSEPacketGenerator.generateStoneCreatedEvent(sphere, stone);
    SSEManager.emit(packet)
  }

  // ----- STONES UPDATE ----- //
  sendStoneSwitchOccurredBySphereId(sphereId, stone, switchState) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendStoneSwitchOccurredEvent(data.sphere, stone, switchState);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendStoneSwitchOccurredEvent(sphere, stone, switchState) {
    let packet = SSEPacketGenerator.generateSwitchStateUpdatedEvent(stone, sphere, switchState);
    SSEManager.emit(packet)
  }

  sendStoneUpdatedEventBySphereId(sphereId, stone) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendStoneUpdatedEvent(data.sphere, stone);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendStoneUpdatedEvent(sphere, stone) {
    let packet = SSEPacketGenerator.generateStoneUpdatedEvent(sphere, stone);
    SSEManager.emit(packet)
  }

  // ----- STONES DELETE ----- //
  sendStoneDeletedEventBySphereId(sphereId, stone) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendStoneDeletedEvent(data.sphere, stone);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendStoneDeletedEvent(sphere, stone) {
    let packet = SSEPacketGenerator.generateStoneDeletedEvent(sphere, stone);
    SSEManager.emit(packet)
  }


  // ----------- ABILITY CHANGE ------------- //
  sendAbilityChangeEventByIds(sphereId, stoneId, ability) {
    return EventConstructor.getData({sphereId, stoneId})
      .then((data) => {
        let packet = SSEPacketGenerator.generateAbilityChangeEvent(data.sphere, data.stone, ability);
        SSEManager.emit(packet)
      })
      .catch((err) => { console.log(err)/** ignore error, simply do not generate event. **/ })
  }



  // LOCATIONS //
  // ----- LOCATIONS CREATE ----- //
  sendLocationCreatedEventBySphereId(sphereId, location) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendLocationCreatedEvent(data.sphere, location);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/
      })
  }
  sendLocationCreatedEvent(sphere, location) {
    let packet = SSEPacketGenerator.generateLocationCreatedEvent(sphere, location);
    SSEManager.emit(packet)
  }

  // ----- LOCATIONS UPDATE ----- //
  sendLocationUpdatedEventBySphereId(sphereId, location) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendLocationUpdatedEvent(data.sphere, location);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/
      })
  }
  sendLocationUpdatedEvent(sphere, location) {
    let packet = SSEPacketGenerator.generateLocationUpdatedEvent(sphere, location);
    SSEManager.emit(packet)
  }

  // ----- LOCATIONS DELETE ----- //
  sendLocationDeletedEventBySphereId(sphereId, stone) {
    return EventConstructor.getData({sphereId})
      .then((data) => {
        this.sendLocationDeletedEvent(data.sphere, stone);
      })
      .catch((err) => { /** ignore error, simply do not generate event. **/ })
  }
  sendLocationDeletedEvent(sphere, location) {
    let packet = SSEPacketGenerator.generateLocationDeletedEvent(sphere, location);
    SSEManager.emit(packet)
  }
}






module.exports = DataChangeEventHandler;
