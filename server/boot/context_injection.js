module.exports = function(app) {

	function inject(ctx, next) {
		var options = hasOptions(ctx.method.accepts) && (ctx.args.options || {});
		if(options) {
			options.remoteCtx = ctx;
			ctx.args.options = options;
		// console.log("inject");
		}
		next();
	}

	app.remotes().before('*.*', function (ctx, next) {
		// console.log("before(*.*): " + ctx.method.name);
		inject(ctx, next);
	});

	app.remotes().before('*.prototype.*', function(ctx, instance, next, p) {
		// console.log("before(*.prototype.*): " + ctx.method.name);

		if (typeof instance === 'function') {
			next = instance
		}

		inject(ctx, next);
	});

	// unfortunately this requires us to add the options object
	// to the remote method definition
	app.remotes().methods().forEach(function(method) {
		if(!hasOptions(method.accepts)) {
			method.accepts.push({
				arg: 'options',
				type: 'object',
				injectCtx: true
			});
		}
	});

	function hasOptions(accepts) {
		for (var i = 0; i < accepts.length; i++) {
			var argDesc = accepts[i];
			if (argDesc.arg === 'options' && argDesc.injectCtx) {
				return true;
			}
		}
	}

}
