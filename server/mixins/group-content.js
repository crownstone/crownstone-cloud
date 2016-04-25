module.exports = function(model, options) {

	// define property: groupId which is used as a reference to the group
	// that "owns" the model instance
	model.defineProperty("groupId", {type: "string", required: true});

	// define the belongTo relation to the Group. this is necessary to
	// distinguish GroupContent and decide who has access to what content
	var Group = require("loopback").getModel("Group");
	model.belongsTo(Group, { foreignKey: "groupId", as: "owner"});

	// define access rules based on the group roles. define here all rules
	// which are common among ALL GroupContent models. If a model needs
	// individual access rules, define them in the respective model.js

	// model.settings.acls.push(
	// 	{
	// 		"accessType": "*",
	// 		"principalType": "ROLE",
	// 		"principalId": "lib-user",
	// 		"permission": "DENY"
	// 	}
	// );

	// todo: does it make sense to define that here? or define it per
	// model. and only do the general disable here

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//////////////////////////////////
		/// UNAUTHENTICATED
		/// 	- nothing
		//////////////////////////////////
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$everyone",
				"permission": "DENY"
			}
		);

		//////////////////////////////////
		/// ADMIN
		/// 	- everyting
		//////////////////////////////////
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$group:admin",
				"permission": "ALLOW"
			}
		);

		//////////////////////////////////
		/// OWNER
		/// 	- everyting
		//////////////////////////////////
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$group:owner",
				"permission": "ALLOW"
			}
		);

		//////////////////////////////////
		/// GUEST
		/// 	- read
		//////////////////////////////////
		model.settings.acls.push(
			{
				"accessType": "READ",
				"principalType": "ROLE",
				"principalId": "$group:guest",
				"permission": "ALLOW"
			}
		);

		//////////////////////////////////
		/// MEMBER
		/// 	- read
		/// 	- create
		/// 	- update
		//////////////////////////////////
		model.settings.acls.push(
			{
				"accessType": "READ",
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "ALLOW"
			}
		);
		model.settings.acls.push(
			{
				"accessType": "WRITE",
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "ALLOW",
				"property": "create"
			}
		);
		model.settings.acls.push(
			{
				"accessType": "WRITE",
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "ALLOW",
				"property": "upsert"
			}
		);
		model.settings.acls.push(
			{
				"accessType": "WRITE",
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "ALLOW",
				"property": "updateAttributes"
			}
		);
	}
}
