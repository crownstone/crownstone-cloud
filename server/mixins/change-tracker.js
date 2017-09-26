"use strict";

const loopback = require('loopback');

/**
 * @param model
 * @param options
 */
module.exports = function (model, options) {

  model.observe('before delete', function(ctx, next) {
    let modelName = ctx.Model.modelName;
    let type = "DELETE";
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
  })

};
