module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL, ADMIN and OWNER
		//  see group-conent.js
		//***************************

		//***************************
		// MEMBER:
		// 	- everything except:
		// 		- delete
		//***************************
		model.settings.acls.push(
			{
				"accessType": "*",
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

	model.disableRemoteMethod('createChangeStream', true);
	model.disableRemoteMethod('updateAll', true);

};
