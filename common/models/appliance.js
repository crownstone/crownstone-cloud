// "use strict";

let loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	let app = require('../../server/server');
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

	model.disableRemoteMethodByName('updateAll');
	model.disableRemoteMethodByName('upsert');
	model.disableRemoteMethodByName('createChangeStream');

	model.disableRemoteMethodByName('__destroyById__stones');
	model.disableRemoteMethodByName('__updateById__stones');
	model.disableRemoteMethodByName('__delete__stones');
	model.disableRemoteMethodByName('__create__stones');
	// model.disableRemoteMethodByName('__link__stones');
	// model.disableRemoteMethodByName('__unlink__stones');


};
