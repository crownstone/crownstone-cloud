"use strict";
let loopback = require('loopback');

module.exports = function(model, options) {

	// define property: sphereId which is used as a reference to the sphere
	// that "owns" the model instance
	model.defineProperty("sphereId", {type: "string", required: true});

	// define the belongTo relation to the Sphere. this is necessary to
	// distinguish SphereContent and decide who has access to what content
	var Sphere = require("loopback").getModel("Sphere");
	model.belongsTo(Sphere, { foreignKey: "sphereId", as: "owner"});


  /**
	 * This piece of code watches the access of the endpoints. This is required for all endpoints that do not have
	 * a model ID like for instance GET/Stone/
   */
	model.observe('access', (context, callback) => {
		if (context.options && context.options.accessToken) {
			// TODO: only when required.
      let userId = context.options.accessToken.userId;
      // get get all sphereIds the user has access to.
      const sphereAccess = loopback.getModel("SphereAccess");
      sphereAccess.find({where: {userId: userId}, fields:{sphereId: true}})
        .then((results) => {
          let possibleIds = [];
          for (let i = 0; i < results.length; i++) {
            possibleIds.push(results[i].sphereId);
          }
          let filter = {sphereId: {inq: possibleIds}};
          const where = context.query.where ? { and: [ context.query.where, filter ] } : filter;

          context.query.where = where;
          callback();
        })
        .catch((err) => {
          callback(err);
        })
    }
    else {
			callback();
		}

	});

	// define access rules based on the sphere roles. define here all rules
	// which are common among ALL SphereContent models. If a model needs
	// individual access rules, define them in the respective model.js

	// model.settings.acls.push(
	// 	 {
	// 	 	"accessType": "*",
	// 	 	"principalType": "ROLE",
	// 	 	"principalId": "lib-user",
	// 	 	"permission": "DENY"
	// 	 }
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
