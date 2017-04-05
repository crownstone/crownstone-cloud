// "use strict";

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	// make sure role is actually part of the defined sphere roles. do not accept
	// any other role
	let roles = ['admin', 'member', 'guest'];
	// model.validatesInclusionOf('role', {in: roles});

};
