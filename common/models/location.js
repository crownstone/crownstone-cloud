var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL:
		//   - nothing
		//***************************
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$everyone",
				"permission": "DENY"
			}
		);
		//***************************
		// OWNER:
		//   - everything
		//***************************
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$group:owner",
				"permission": "ALLOW"
			}
		);
		//***************************
		// MEMBER:
		//   - everything except:
		//   	- delete stone(s)
		//   	- remove stone(s)
		//   	- delete location
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
				"property": "__destroyById__stones"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__unlink__stones"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__delete__stones"
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
		//   - update stone(s)
		//***************************
		model.settings.acls.push(
			{
				"accessType": "READ",
				"principalType": "ROLE",
				"principalId": "$group:guest",
				"permission": "ALLOW"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:guest",
				"permission": "ALLOW",
				"property": "__updateById__stones"
			}
		);
	}

	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__link__presentPeople', false);
	model.disableRemoteMethod('__unlink__presentPeople', false);
	model.disableRemoteMethod('__findById__presentPeople', false);
	model.disableRemoteMethod('__updateById__presentPeople', false);
	model.disableRemoteMethod('__destroyById__presentPeople', false);
	model.disableRemoteMethod('__create__presentPeople', false);
	model.disableRemoteMethod('__delete__presentPeople', false);

	model.beforeRemote('**', function(ctx, instance, next) {
		// debug("method.name: ", ctx.method.name);
		next();
	});

	model.beforeRemote('*.__create__stones', function(ctx, instance, next) {
		// debug("ctx:", ctx);
		// debug("instance:", instance);
		if (ctx.args.data) {
			ctx.args.data.groupId = ctx.instance.groupId;
		}
		next();
	});

};
