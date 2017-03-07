// "use strict";

const loopback = require('loopback');
const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	model.observe('before save', function(ctx, next) {

		const Stone = loopback.getModel('Stone');
		Stone.findById(ctx.instance.stoneId, function(err, stone) {
			if (err) next(err);
			ctx.instance.sphereId = stone.sphereId;
			next();
		});

		// next();
	});

};
