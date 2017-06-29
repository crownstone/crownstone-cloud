"use strict";

const loopback = require('loopback');
const fetch = require('node-fetch');

/**
 * Mixin that hooks the Webhook system into existing models. It generates a list of available events based on the REST endpoints.
 *
 * We assume all extended models have a reference of
 * let idField = model.modelName.toLowerCase() + 'Id';
 * like stoneId or sphereId to link their data to the parent type.
 * @param model
 * @param options
 */
module.exports = function (model, options) {
  let events = [];
  let eventReference = {};
  let eventPathReference = {};

  // TODO: permissions
  // model.settings.acls.push(
  //   {
  //     "principalType": "ROLE",
  //     "principalId": "$group:admin",
  //     "permission": "ALLOW",
  //     "property": "prototype.__create__hooks"
  //   }
  // );

  // console.log(model.sharedClass._disabledMethods)

  model.settings.acls.push({
    "principalType": "ROLE",
    "principalId": "$everyone",
    "permission": "ALLOW",
    "property": "getEvents"
  });


  /**
   * Update the existing description with the addition of the name of the event
   * @param name
   * @param description
   * @returns {string}
   * @private
   */
  let _injectEventDescription = function(name, description) {
    return '<div style="text-align:left;">' + description + '</div><div style="text-align:right; padding:5px;"> Event: ' + name + '</div>';
  };


  /**
   * We check the methods on the model to see if we have to inject an event into it
   * @param method
   * @param http
   * @returns {{name, verb: string, path}}
   * @private
   */
  let _extractEventNameFromMethod = function (method, http) {
    if (http.verb && eventReference[method.name] !== true) {
      let verb = http.verb.toLowerCase();
      if (verb === 'post' || verb === 'put' || verb === 'patch' || verb === 'delete') {
        // console.log(model.modelName, http, verb, method.name, model.sharedClass._disabledMethods[method.name])

        // do not show disabled endpoints
        if (model.sharedClass._disabledMethods[method.name]) {
          return;
        }

        // console.log("Injecting event in:",method.name)

        method.description = _injectEventDescription(method.name, method.description);
        eventReference[method.name] = true;
        eventPathReference[http.path + "__" + verb.toUpperCase()] = true;
        return {name: method.name, verb:verb, path:http.path};
      }
    }
  };


  /**
   * On a request, we check if this method has an event option. If it does, we check if there are listeners.
   * @param ctx
   * @param changedData
   * @param next
   * @returns {*}
   * @private
   */
  let _checkForEventListeners = function (ctx, changedData, next) {
    let eventName = ctx.method.name;
    if (eventReference[eventName] === undefined) {
      return next();
    }

    let http = ctx.method.http;
    if (Array.isArray(http)) {
      http = http[0];
    }
    let verb = http.verb;
    if (verb === 'post' || verb === 'put' || verb === 'patch' || verb === 'delete') {
      _checkForHooksOnEndpoint(ctx, changedData, eventName);
    }

    next();
  };


  /**
   * Check if there are listeners on this endpoint.
   * @param ctx
   * @param changedData
   * @param eventName
   * @private
   */
  let _checkForHooksOnEndpoint = function(ctx, changedData, eventName) {
    _getModelInstanceForRequest(ctx, changedData)
      .then((parentInstance) => {
        if (parentInstance && parentInstance.hooks && parentInstance.hooks.length > 0) {
          let hooks = parentInstance.hooks();
          // todo: OPTIMIZE
          for (let i = 0; i < hooks.length; i++) {
            let hook = hooks[i];
            if (!hook.uri || hook.enabled === false) { return; }
            for (let j = 0; j < hook.events.length; j++) {
              if (hook.events[j] === eventName) {
                _getModelInstanceWithoutHooks(ctx, changedData)
                  .then((result) => {
                    _notifySubscribers(changedData, result, eventName, hook);
                  })
              }
            }
          }
        }
      })
  };


  /**
   * Notify all webhooks on this event
   * @param changedData         // this is the changed data
   * @param parentInstance      // this is the parent model, like a stone or a sphere. If a ownedStone from a sphere changes, the parent is the sphere.
   * @param eventName           // name of the event
   * @param hook                // the webhook object.
   * @private
   */
  let _notifySubscribers = function(changedData, parentInstance, eventName, hook) {
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


  /**
   * Get model instance from context including the webhooks.
   * @param ctx
   * @param modelInstance
   * @private
   */
  let _getModelInstanceForRequest = function(ctx, modelInstance) {
    let idField = model.modelName.toLowerCase() + 'Id';

    if (!modelInstance) {
      if (ctx && ctx.args && ctx.args.id) {
        return model.findById(ctx.args.id, {include: 'hooks'});
      }
    }

    if (modelInstance[idField]) {
      return model.findById(modelInstance[idField], {include: 'hooks'});
    }
    else {
      return model.findById(modelInstance.id, {include: 'hooks'})
    }
  };


  /**
   * Get model instance from context without the added webhooks.
   * @param ctx
   * @param modelInstance
   * @returns {Promise}
   * @private
   */
  let _getModelInstanceWithoutHooks = function(ctx, modelInstance) {
    let idField = model.modelName.toLowerCase() + 'Id';
    if (modelInstance[idField]) {
      return model.findById(modelInstance[idField]);
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
        let event = _extractEventNameFromMethod(method, subMethod);
        if (event) { events.push(event); }
      });
    }
    else {
      let event = _extractEventNameFromMethod(method, method.http);
      if (event) { events.push(event); }
    }
  });

  // set hooks to respond to all calls and determine if this is an hookable event.
  model.afterRemote('**', _checkForEventListeners);

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


  let relations = model.settings.relations;
  let relationKeys = Object.keys(relations);

  relationKeys.forEach((relationKey) => {
    let relation = relations[relationKey];
    if (relation.type === 'hasMany') {
      // each relation of type hasMany will create the following fields:
      // create
      // destroyAll
      // findById
      // destroy
      // count

      let setupRelay = (overloadName, verb, path, relayCommand, requiresData, requiresForeignKey, returnsData, baseDescription, aclKey) => {
        if (model[overloadName] !== undefined) {
          console.log('Warning: on model: (', model.modelName, ') the method: ',overloadName,' is already overloaded. Skipping overloading.');
          return;
        }

        // add these fields to the event listener
        events.push({name: overloadName, verb: verb, path: path});
        eventReference[overloadName] = true;

        // create the overload function that will just forward the functionality
        model[overloadName] = function(arg1, arg2, arg3, arg4) {
          // map the arguments to the variables.
          let data = null;
          let id = null;
          let fk = null;
          let next = null;

          // if we require data, it is the first argument, id is the second, foreign key the third and next callback the last.
          if (requiresData === true) {
            data = arg1;
            id = arg2;
            if (requiresForeignKey) {
              fk = arg3;
              next = arg4;
            }
            else {
              next = arg3;
            }
          }
          else {
            id = arg1;
            if (requiresForeignKey) {
              fk = arg2;
              next = arg3;
            }
            else {
              next = arg2;
            }
          }

          model.findById(id)
            .then((result) => {
              if (result) {
                return relayCommand(result, relationKey, data, id, fk);
              }
              throw 'Unauthorized'
            })
            .then((newData) => {
              if (returnsData) {
                next(null, newData);
              }
              else {
                next();
              }
            })
            .catch((err) => {
              next(err);
            })
        };

        let config = {http: {path: path, verb: verb.toUpperCase()}};

        let accepts = [];
        if (requiresData) {
          accepts.push({arg: 'data', type: relation.model, required: true, http: {source: 'body'}});
        }
        accepts.push({arg: 'id', type: 'any', required: true, http: {source: 'path'}});

        if (requiresForeignKey) {
          accepts.push({arg: 'fk', type: 'any', required: true, 'http': {source: 'path'}});
        }

        config.accepts = accepts;
        if (returnsData) {
          config.returns = {arg: 'data', type: relation.model, root: true};
        }
        config.description = _injectEventDescription(overloadName, baseDescription);

        model.remoteMethod(
          overloadName,
          config
        );

        // check and reset the ACL if required.
        model.settings.acls.forEach((acl) => {
          if (acl.property === [aclKey]) {
            let newAcl = {};
            // copy the acl entry
            let aclKeys = Object.keys(acl);
            aclKeys.forEach((key) => {
              newAcl[key] = acl[key];
            });
            newAcl.property = overloadName;
            model.settings.acls.push(newAcl)
          }
        });
      };

      // check if we have overloaded this path already and if it is disabled.
      if (eventPathReference['/:id/' + relationKey + '/__POST'] !== true && model.sharedClass._disabledMethods['prototype.__create__' + relationKey] !== true) {
        let overloadName = 'set' + capitalizeFirstLetter(relationKey);
        setupRelay(
          overloadName,                 // overloadName
          'post',                       // verb
          '/:id/' + relationKey + '/',  // path
          (result, relationKey, data, id, fk) => { return result[relationKey].create(data); }, // relayCommand
          true,                         // requiresData
          false,                        // requiresForeignKeyData
          true,                         // returnsData
          'Creates a new instance in ' + relationKey + ' of this model.',               // baseDescription
          '__create__'+relationKey      // aclKey
        );
      }

      if (
        eventPathReference['/:id/' + relationKey + '/:fk__DELETE'] !== true &&
        (model.sharedClass._disabledMethods['prototype.__destroyById__' + relationKey] !== true ||
         model.sharedClass._disabledMethods['prototype.__deleteById__' + relationKey]  !== true)
      ) {
        let overloadName = 'deleteById' + capitalizeFirstLetter(relationKey);
        setupRelay(
          overloadName,                   // overloadName
          'delete',                       // verb
          '/:id/' + relationKey + '/:fk', // path
          (result, relationKey, data, id, fk) => { return result[relationKey].destroy(fk); }, // relayCommand
          false,                          // requiresData
          true,                           // requiresForeignKeyData
          false,                          // returnsData
          'Delete a related item by id for ' + relationKey + '.', // baseDescription
          '__delete__'+relationKey        // aclKey
        );
      }

      if (eventPathReference['/:id/' + relationKey + '/:fk__PUT'] !== true && model.sharedClass._disabledMethods['prototype.__updateById__' + relationKey] !== true) {
        let overloadName = 'patch' + capitalizeFirstLetter(relationKey);
        setupRelay(
          overloadName,                   // overloadName
          'put',                          // verb
          '/:id/' + relationKey + '/:fk', // path
          (result, relationKey, data, id, fk) => { return result[relationKey].updateById(fk, data); }, // relayCommand
          true,                           // requiresData
          true,                           // requiresForeignKeyData
          true,                           // returnsData
          'Add/update a related item by id for ' + relationKey + '.', // baseDescription
          '__updateById__'+relationKey    // aclKey
        );
      }
    }
    else {
      // console.log(model.modelName, "relation not overloaded", relation);
    }
  });

};

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
