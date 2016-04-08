var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	model.beforeRemote('**', function(ctx, instance, next) {
		debug("method.name: ", ctx.method.name);
		next();
	});

	model.observe('before save', function(ctx, next) {
		debug("ctx:", ctx);
		next();
	})

};
