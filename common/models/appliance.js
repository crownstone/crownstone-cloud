var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL, ADMIN and OWNER
		//  see sphere-content.js
		//***************************

		//***************************
		// MEMBER:
		//***************************
		// model.settings.acls.push(
		// 	{
		// 		"accessType": "*",
		// 		"principalType": "ROLE",
		// 		"principalId": "$group:member",
		// 		"permission": "ALLOW"
		// 	}
		// );

		//***************************
		// GUEST:
		//***************************
		// model.settings.acls.push(
		// 	{
		// 		"accessType": "READ",
		// 		"principalType": "ROLE",
		// 		"principalId": "$group:guest",
		// 		"permission": "ALLOW"
		// 	}
		// );
	}

	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__destroyById__stones', false);
	model.disableRemoteMethod('__updateById__stones', false);
	model.disableRemoteMethod('__delete__stones', false);
	model.disableRemoteMethod('__create__stones', false);
	model.disableRemoteMethod('__link__stones', false);
	// model.disableRemoteMethod('__unlink__stones', false);


};
