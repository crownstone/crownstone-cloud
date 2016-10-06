var groupRoles = require('../../server/component-config.json')["loopback-component-access-groups"]["groupRoles"]

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	// make sure role is actually part of the defined sphere roles. do not accept
	// any other role
	var roles = Array.from(groupRoles, groupRoles => groupRoles.split(':')[1]);
	model.validatesInclusionOf('role', {in: roles});

};
