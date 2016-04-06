var groupRoles = require('../../server/component-config.json')["loopback-component-access-groups"]["groupRoles"]

module.exports = function(model) {

	model.validatesInclusionOf('role', {in: groupRoles});

};
