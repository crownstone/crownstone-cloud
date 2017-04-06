module.exports = function(model, options) {

	// define property: sphereId which is used as a reference to the sphere
	// that "owns" the model instance
	model.defineProperty("sphereId", {type: "string", required: true});

	// define the belongTo relation to the Sphere. this is necessary to
	// distinguish SphereContent and decide who has access to what content
	var Sphere = require("loopback").getModel("Sphere");
	model.belongsTo(Sphere, { foreignKey: "sphereId", as: "owner"});

	// define access rules based on the sphere roles. define here all rules
	// which are common among ALL SphereContent models. If a model needs
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
		/// 	- everything
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
