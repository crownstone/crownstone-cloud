var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL, ADMIN and OWNER
		//  see group-conent.js
		//***************************

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

	/************************************
	 **** Model Validation
	 ************************************/

	model.validatesUniquenessOf('name', {scopedTo: ['groupId'], message: 'a location with this name was already added'});

	/************************************
	 **** Cascade
	 ************************************/

	// if the group is deleted, delete also all files stored for this group
	model.observe('before delete', function(context, next) {
		model.deleteIcon(context.where.id, function() {
			next();
		});
	});

	/************************************
	 **** Custom functions
	 ************************************/

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

	/************************************
	 **** Icon Methods
	 ************************************/

	model.uploadIcon = function(id, req, next) {
		debug("uploadIcon");

		const Group = loopback.getModel('Group');

		var upload = function(location, req) {

			// upload the file
			Group.uploadFile(location.groupId, req, function(err, file) {
				if (err) return next(err);

				// and set the id as profilePicId
				location.iconId = file._id;
				location.save();

				next(null, file);
			});
		}

		// get the location instance
		model.findById(id, function(err, location) {
			if (err) return next(err);

			// if there is already an uploaded, delete the old one first
			if (location.iconId) {
				Group.deleteFile(location.groupId, location.iconId, function(err, file) {
					if (err) return next(err);
					upload(location, req);
				});
			} else {
				upload(location, req);
			}

		});
	}

	model.remoteMethod(
		'uploadIcon',
		{
			http: {path: '/:id/icon', verb: 'post'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'req', type: 'object', http: { source: 'req' }}
			],
			returns: {arg: 'file', type: 'object', root: true},
			description: "Upload icon to location"
		}
	);

	model.downloadIcon = function(id, res, next) {
		debug("downloadIcon");

		const Group = loopback.getModel('Group');

		// get the location instance
		model.findById(id, function(err, location) {
			if (err) return next(err);

			if (!location) {
				error = new Error("no location found with this id");
				error.statusCode = 404;
    			error.code = 'MODEL_NOT_FOUND';
				return next(error);
			}

			Group.downloadFile(location.groupId, location.iconId, res, next);
		});
	}

	model.remoteMethod(
		'downloadIcon',
		{
			http: {path: '/:id/icon', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download profile pic of User"
		}
	);

	model.deleteIcon = function(id, next) {
		debug("deleteIcon");

		const Group = loopback.getModel('Group');

		// get the location instance
		model.findById(id, function(err, location) {
			if (err) return next(err);

			if (!location) {
				error = new Error("no location found with this id");
				error.statusCode = 404;
    			error.code = 'MODEL_NOT_FOUND';
				return next(error);
			}

			Group.deleteFile(location.groupId, location.iconId, next);
		});
	}

	model.remoteMethod(
		'deleteIcon',
		{
			http: {path: '/:id/icon/:fk', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete icon of location"
		}
	);

};
