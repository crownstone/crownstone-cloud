"use strict";

const loopback = require('loopback');
const ObjectID = require('mongodb').ObjectID;
/**
 * @param model
 * @param options
 */
module.exports = function (model, options) {

  model.observe('before delete', function(ctx, next) {
    let modelName = ctx.Model.modelName;
    let type = "DELETE";

    // in case of a deleteAll
    if (ctx.instance === undefined) {
      let deleteModel = loopback.getModel(modelName);

      let sphereId = null;
      new Promise((resolve,reject) => {

        // delete ALL events may not always yield the sphereId
        let whereFilterKeys = ctx.where ? Object.keys(ctx.where) : [];
        if (whereFilterKeys.length > 0) {
          if (whereFilterKeys[0] === 'stoneId') {
            return _getSphereIdFromStone(ctx.where.stoneId)
              .then((sphereIdFound) => {
                sphereId = sphereIdFound;
                resolve();
              })
              .catch((err) => { resolve(); })
          }
        }
        resolve();
      })
      .then(() => {
        return deleteModel.find({where: ctx.where})
      })
      .then((results) => {
        let dataChanges = [];
        for (let i = 0; i < results.length; i++) {
          dataChanges.push({model: modelName, type: type, itemId: results[i].id, sphereId: results[i].sphereId || sphereId })
        }

        if (dataChanges.length > 0) {
          let Changes = loopback.getModel("Change");
          return Changes.create(dataChanges)
        }
      })
      .then(() => {
        next();
      })
      .catch((err) => {
        next(err);
      })
    }
    else {
      // delete single item
      let itemId = ctx.instance.id;
      let sphereId = ctx.instance.sphereId;

      new Promise((resolve,reject) => {
        sphereId = ctx.instance.sphereId;
        if (!sphereId) {
          if (ctx.instance.stoneId) {
            return _getSphereIdFromStone(ctx.where.stoneId)
              .then((sphereIdFound) => {
                sphereId = sphereIdFound;
                resolve();
              })
              .catch((err) => { reject("Could not find sphereId in model with id: " + itemId); })
          }
          else {
            reject("Could not find sphereId in model with id: " + itemId);
          }
        }
        else {
          resolve();
        }
      })
        .then(() => {
          let Changes = loopback.getModel("Change");
          return Changes.create({model: modelName, type: type, itemId: itemId, sphereId: sphereId})
        })
        .then(() => {
          next();
        })
        .catch((err) => {
          next(err);
        })
    }
  });

  const _getSphereIdFromStone = function(stoneId) {
    let stoneModel = loopback.getModel('Stone');
    return stoneModel.findById(stoneId)
      .then((result) => {
        if (result !== null) {
          return result.sphereId;
        }
        else {
          throw "Stone with id " + stoneId + ' not found.'
        }
      })
  }

};
