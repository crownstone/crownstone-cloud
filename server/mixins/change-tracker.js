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

      deleteModel.find({where: ctx.where})
        .then((results) => {
          let dataChanges = [];
          for (let i = 0; i < results.length; i++) {
            dataChanges.push({model: modelName, type: type, itemId: results[i].id, sphereId: results[i].sphereId})
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

      let Changes = loopback.getModel("Change");
      Changes.create({model: modelName, type: type, itemId: itemId, sphereId: sphereId})
        .then(() => {
          next();
        })
        .catch((err) => {
          next(err);
        })
    }
  })

};
