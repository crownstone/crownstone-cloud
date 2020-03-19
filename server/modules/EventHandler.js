const PresenceEventHandler   = require('./events/PresenceEventHandler');
const DataChangeEventHandler = require('./events/DataChangeEventHandler');
const CommandEventHandler    = require('./events/CommandEventHandler');

class EventHandlerClass {

  constructor() {
    this.presence   = new PresenceEventHandler();
    this.command    = new CommandEventHandler();
    this.dataChange = new DataChangeEventHandler();
  }
}

const EventHandler = new EventHandlerClass();

module.exports = EventHandler;
