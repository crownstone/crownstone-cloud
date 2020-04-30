// "use strict";

let loopback = require('loopback');
const idUtil = require('./sharedUtil/idUtil');
const debug = require('debug')('loopback:crownstone');
const EventHandler = require('../../server/modules/EventHandler');

module.exports = function(model) {

	let app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL, ADMIN and OWNER
		//  see sphere-content.js
		//***************************

		//***************************
		// MEMBER:
		//   - everything except:
		//   	- delete stone(s)
		//   	- remove stone(s)
		//   	- delete scene
    //    - delete messages
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
		//   - read
    //   - send message
		//***************************
		model.settings.acls.push(
      {
        "accessType": "READ",
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW"
      }
    );
		// model.settings.acls.push(
		// 	{
		// 		"principalType": "ROLE",
		// 		"principalId": "$group:guest",
		// 		"permission": "ALLOW",
		// 		"property": "__updateById__stones"
		// 	}
		// );
	}


	model.disableRemoteMethodByName('replaceById');
	model.disableRemoteMethodByName('updateAll');
	model.disableRemoteMethodByName('create');
	model.disableRemoteMethodByName('upsert');
	model.disableRemoteMethodByName('createChangeStream');

  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__owner');



};
