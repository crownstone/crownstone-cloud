const _ = require('lodash');
const loopback = require('loopback');

/**
 * Mixin that does a cascade delete on related items that are identifed in the
 * settings for this mixin within a particular model
 * @param Model
 * @param options
 */
module.exports = function (Model, options) {

  Model.observe('after delete', function (ctx, next) {

    //Get the ID of the record that's being deleted
    let promises = [];
    let id = ctx.where.id;
    let keys = Object.keys(options);

    console.log('cascade options', options)

    if (id) {
      // TODO: get rid of lodash
      _.each(keys, function (model) {

        let foreignKey = options[model];
        let linkModel = loopback.getModelByType(model);
        let where = {};

        where[foreignKey] = id;

        console.log("CASCADE delete ", linkModel.modelName, " where ", where);

        promises.push(linkModel.destroyAll(where));
      });

    } else if (ctx.where.sphereId) {
      // console.log("ctx.where", ctx.where);

      // this is a special case for our setup. objects that belong the a sphere
      // can be deleted through the sphere, in which case they are deleted in a
      // batch based on the sphereId. So if there is no id specified, we check
      // also if there is a sphereId specified, and use that instead of the
      // id/foreignKey
      // TODO: get rid of lodash
      _.each(keys, function (model) {

        let linkModel = loopback.getModelByType(model);
        let where = {};

        where["sphereId"] = ctx.where.sphereId;

        console.log("CASCADE delete ", linkModel.modelName, " where ", where);

        promises.push(linkModel.destroyAll(where));
      });

    }

    Promise.all(promises)
      .then(function () {
        next();
      })
      .catch((err) => {
        next(err)
      })

  });

};
