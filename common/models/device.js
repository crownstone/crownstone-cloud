var stl = require('../../server/middleware/deviceScanToLocation');
var loopback = require('loopback');

module.exports = function(model) {

	/*
    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    },
    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$owner",
      "permission": "ALLOW"
    }
	 */

	// address has to be unique to a stone
	model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

	model.disableRemoteMethod('__updateById__coordinatesHistory', false);
	model.disableRemoteMethod('__link__coordinatesHistory', false);
	model.disableRemoteMethod('__unlink__coordinatesHistory', false);
	model.disableRemoteMethod('__exists__coordinatesHistory', false);
	model.disableRemoteMethod('__findById__coordinatesHistory', false);

	model.disableRemoteMethod('__updateById__locationsHistory', false);
	model.disableRemoteMethod('__link__locationsHistory', false);
	model.disableRemoteMethod('__unlink__locationsHistory', false);
	model.disableRemoteMethod('__exists__locationsHistory', false);
	model.disableRemoteMethod('__findById__locationsHistory', false);

	model.disableRemoteMethod('__updateById__scans', false);
	model.disableRemoteMethod('__findById__scans', false);

	model.disableRemoteMethod('createChangeStream', true);
	// model.disableRemoteMethod('create', true);
	// model.disableRemoteMethod('find', true);
	model.disableRemoteMethod('findOne', true);
	model.disableRemoteMethod('upsert', true);

	model.afterRemote('prototype.__create__scans', function(ctx, instance, next) {
		const loopbackContext = loopback.getCurrentContext();
		var currentUser = loopbackContext.get('currentUser');

		// console.log("ctx: ", ctx);
		// console.log("instance: ", ctx.instance);

		next();
		stl.update(ctx.args.data, ctx.instance, currentUser);

	});

};
