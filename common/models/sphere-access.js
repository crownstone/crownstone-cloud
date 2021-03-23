// "use strict";

const debug = require('debug')('loopback:crownstone');

module.exports = function(model) {

	// make sure role is actually part of the defined sphere roles. do not accept
	// any other role
	let roles = ['admin', 'member', 'guest', 'hub'];
	// model.validatesInclusionOf('role', {in: roles});

};
