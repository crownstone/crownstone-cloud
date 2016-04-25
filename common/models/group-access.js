var groupRoles = require('../../server/component-config.json')["loopback-component-access-groups"]["groupRoles"]

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	// model.validatesInclusionOf('role', {in: groupRoles});

	model.beforeRemote('**', function(ctx, instance, next) {
		debug("method.name: ", ctx.method.name);
		next();
	});

};
