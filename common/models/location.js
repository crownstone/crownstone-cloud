var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__link__presentPeople', false);
	model.disableRemoteMethod('__unlink__presentPeople', false);
	model.disableRemoteMethod('__findById__presentPeople', false);
	model.disableRemoteMethod('__updateById__presentPeople', false);
	model.disableRemoteMethod('__destroyById__presentPeople', false);
	model.disableRemoteMethod('__create__presentPeople', false);
	model.disableRemoteMethod('__delete__presentPeople', false);

	model.beforeRemote('**', function(ctx, instance, next) {
		// debug("method.name: ", ctx.method.name);
		next();
	});

	model.beforeRemote('*.__create__stones', function(ctx, instance, next) {
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		if (ctx.args.data) {
			ctx.args.data.groupId = ctx.instance.groupId;
		}
		next();
	});

};
