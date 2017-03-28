// "use strict";

module.exports = function(model) {

	let app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL, ADMIN and OWNER
		//  see sphere-content.js
		//***************************

		//***************************
		// MEMBER:
		// 	- everything except:
		// 		- delete
		//***************************
		model.settings.acls.push(
			{
				"accessType": "EXECUTE",
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "ALLOW"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "deleteById"
			}
		);
		//***************************
		// GUEST:
		// 	- nothing (caught by GENERAL)
		//***************************

	}

	model.disableRemoteMethodByName('createChangeStream');
	model.disableRemoteMethodByName('updateAll');
	model.disableRemoteMethodByName('upsert');
	model.disableRemoteMethodByName('findOne');

	model.disableRemoteMethodByName('updateAttributes');

};
