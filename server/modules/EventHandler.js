const fetch = require('node-fetch');

class EventHandlerClass {
  constructor() {}

  notifyHooks(model, id, changedData, eventName) {
    model.findById(id, {include: 'hooks'})
      .then((result) => {
        if (result && result.hooks && result.hooks.length > 0) {
          let hooks = result.hooks();
          for (let i = 0; i < hooks.length; i++) {
            let hook = hooks[i];
            if (!hook.uri || hook.enabled === false) { continue; }
            for (let j = 0; j < hook.events.length; j++) {
              if (hook.events[j] === eventName) {
                model.findById(id)
                  .then((result) => {
                    this.notifySubscribers(changedData, result, eventName, hook);
                  })
              }
            }
          }
        }
      })
      .catch((err) => { console.log("err", err) })
  }


  /**
   * Notify all webhooks on this event
   * @param changedData         // this is the changed data
   * @param parentInstance      // this is the parent model, like a stone or a sphere. If a ownedStone from a sphere changes, the parent is the sphere.
   * @param eventName           // name of the event
   * @param hook                // the webhook object.
   * @private
   */
   notifySubscribers(changedData, parentInstance, eventName, hook) {
    let headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Hook-Secret': hook.secret,
    };

    let body = JSON.stringify({
      event: eventName,
      secret: hook.secret,
      data: changedData,
      parent: parentInstance
    });


    let config = { method: 'POST', headers, body: body};
    fetch(hook.uri, config).catch((err) => { console.log("Error while notifying endpoint.", err); });
  };
}






module.exports = new EventHandlerClass();
