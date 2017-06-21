"use strict";

const loopback = require('loopback');
const fetch = require('node-fetch');

/**
 * Mixin that hooks the Webhook system into existing models. It generates a list of available events based on the REST endpoints.
 * @param model
 * @param options
 */
module.exports = function (model, options) {
  let events = [];
  let eventReference = {};

  // TODO: permissions
  // model.settings.acls.push(
  //   {
  //     "principalType": "ROLE",
  //     "principalId": "$group:admin",
  //     "permission": "ALLOW",
  //     "property": "prototype.__create__hooks"
  //   }
  // );

  model.settings.acls.push({
    "principalType": "ROLE",
    "principalId": "$everyone",
    "permission": "ALLOW",
    "property": "getEvents"
  });

  let _extractEvent = function (method, http) {
    if (http.verb) {
      let verb = http.verb.toLowerCase();
      if (verb === 'post' || verb === 'put') {

        // do not show disabled endpoints
        if (model.sharedClass._disabledMethods[method.name]) {
          return;
        }

        method.description = '<div style="text-align:left;">' + method.description + '</div><div style="text-align:right; padding:5px;"> Event: ' + method.name + '</div>';
        eventReference[method.name] = true;
        return {name: method.name, verb:verb, path:http.path};
      }
    }
  };

  let _parseEvent = function (ctx, changedData, next) {
    let eventName = ctx.method.name;
    if (eventReference[eventName] === undefined) {
      return next();
    }

    let http = ctx.method.http;
    if (Array.isArray(http)) {
      http = http[0];
    }
    let verb = http.verb;

    if (verb === 'post' || verb === 'put' || verb === 'patch') {
      _checkHooks(ctx, changedData, eventName);
    }

    next();
  };

  let _checkHooks = function(ctx, changedData, eventName) {
    _getInstance(ctx, changedData)
      .then((parentInstance) => {
        if (parentInstance && parentInstance.hooks && parentInstance.hooks.length > 0) {
          let hooks = parentInstance.hooks();
          // todo: OPTIMIZE
          for (let i = 0; i < hooks.length; i++) {
            let hook = hooks[i];
            if (!hook.uri || hook.enabled === false) { return; }
            for (let j = 0; j < hook.events.length; j++) {
              if (hook.events[j] === eventName) {
                _getInstanceWithoutHooks(ctx, changedData)
                  .then((result) => {
                    _processEvent(changedData, result, eventName, hook);
                  })
              }
            }
          }
        }
      })
  };


  // send out event to webhook.
  let _processEvent = function(changedData, parentInstance, eventName, hook) {
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
    fetch(hook.uri, config)
      .then((result) => {
        console.log("Notified Endpoint.");
        result.text().then((data) => {
          console.log("response:", data);
        })
      })
      .catch((err) => {
        console.log("Error while notifying endpoint.", err);
      })
  };

  let _getInstance = function(ctx, modelInstance) {
    if (modelInstance.stoneId) {
      return model.findById(modelInstance.stoneId, {include: 'hooks'});
    }
    else {
      return model.findById(modelInstance.id, {include: 'hooks'})
    }
  };


  // used to get the base model without hook references.
  let _getInstanceWithoutHooks = function(ctx, modelInstance) {
    if (modelInstance.stoneId) {
      return model.findById(modelInstance.stoneId);
    }
    else {
      return new Promise((resolve, reject) => { resolve(modelInstance); });
    }
  };


  // link to the hooks model.
  const Hooks = loopback.findModel('Hook');
  model.hasMany(Hooks);

  // extract events from model (all post,put,patch endpoints)
  model.sharedClass._methods.forEach((method) => {
    if (Array.isArray(method.http)) {
      method.http.forEach((subMethod) => {
        let event = _extractEvent(method, subMethod);
        if (event) { events.push(event); }
      });
    }
    else {
      let event = _extractEvent(method, method.http);
      if (event) { events.push(event); }
    }
  });

  // set hooks to respond to all calls and determine if this is an hookable event.
  model.afterRemote('**', _parseEvent);
  model.observe('after save', function(ctx, next) {
    console.log('ctx.instance);',ctx.instance);
    console.log('ctx.isNewInstance);',ctx.isNewInstance);
    console.log('ctx.hookState);',ctx.hookState);
    console.log('ctx.options);',ctx.options);
    next();
  });

  // endpoint to read out the events
  model.getEvents = function(next) { next(null, events); };
  model.remoteMethod(
    'getEvents',
    {
      http: {path: '/events', verb: 'get'},
      description: "Get all the events that are available on this model that you can hook into.",
      returns: {arg: 'events', type: 'any', root: true},
    }
  );

};

