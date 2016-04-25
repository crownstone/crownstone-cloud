var _ = require('lodash'),
    loopback = require('loopback');

/**
 * Mixin that does a cascade delete on related items that are identifed in the
 * settings for this mixin within a particular model
 * @param Model
 * @param options
 */
module.exports = function(Model, options) {

    Model.observe('after delete', function(ctx, next) {

        //Get the ID of the record that's being deleted
        var promises = [],
            requestContext = loopback.getCurrentContext(),
            id = ctx.where.id,
            keys = Object.keys(options);

        _.each(keys, function(model) {

            var foreignKey = options[model],
                linkModel = loopback.getModelByType(model),
                where = {};

            where[foreignKey] = id;

            promises.push(linkModel.destroyAll(where));
        });

        Promise.all(promises)
            .then(function() {
                next();
            });

    });

};
