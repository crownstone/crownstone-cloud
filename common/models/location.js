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
		//   - everything except:
		//   	- delete stone(s)
		//   	- remove stone(s)
		//   	- delete location
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
		// model.settings.acls.push(
		// 	{
		// 		"principalType": "ROLE",
		// 		"principalId": "$group:guest",
		// 		"permission": "ALLOW",
		// 		"property": "__updateById__stones"
		// 	}
		// );
	}


	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__link__presentPeople', false);
	model.disableRemoteMethod('__unlink__presentPeople', false);
	model.disableRemoteMethod('__findById__presentPeople', false);
	model.disableRemoteMethod('__updateById__presentPeople', false);
	model.disableRemoteMethod('__destroyById__presentPeople', false);
	model.disableRemoteMethod('__create__presentPeople', false);
	model.disableRemoteMethod('__delete__presentPeople', false);

	model.disableRemoteMethod('__delete__stones', false);
	model.disableRemoteMethod('__deleteById__stones', false);
	model.disableRemoteMethod('__destroyById__stones', false);

	/************************************
	 **** Model Validation
	 ************************************/

	model.validatesUniquenessOf('name', {scopedTo: ['sphereId'], message: 'a location with this name was already added'});

	/************************************
	 **** Cascade
	 ************************************/

	// if the sphere is deleted, delete also all files stored for this sphere
	model.observe('before delete', function(context, next) {
		model.deleteImage(context.where.id, function() {
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
			ctx.args.data.sphereId = ctx.instance.sphereId;
		}
		next();
	});

	/************************************
	 **** Image Methods
	 ************************************/

	model.uploadImage = function(id, req, next) {
		debug("uploadImage");

		const Sphere = loopback.getModel('Sphere');

		var upload = function(location, req) {

			// upload the file
			Sphere.uploadFile(location.sphereId, req, function(err, file) {
				if (err) return next(err);

				// and set the id as profilePicId
				location.imageId = file._id;
				location.save();

				next(null, file);
			});
		}

		// get the location instance
		model.findById(id, function(err, location) {
			if (err) return next(err);

			// if there is already an uploaded, delete the old one first
			if (location.imageId) {
				Sphere.deleteFile(location.sphereId, location.imageId, function(err, file) {
					if (err) return next(err);
					upload(location, req);
				});
			} else {
				upload(location, req);
			}

		});
	}

	model.remoteMethod(
		'uploadImage',
		{
			http: {path: '/:id/image', verb: 'post'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'req', type: 'object', http: { source: 'req' }}
			],
			returns: {arg: 'file', type: 'object', root: true},
			description: "Upload image to location"
		}
	);

	model.downloadImage = function(id, res, next) {
		debug("downloadImage");

		const Sphere = loopback.getModel('Sphere');

		// get the location instance
		model.findById(id, function(err, location) {
			if (err) return next(err);

			if (!location) {
				error = new Error("no location found with this id");
				error.statusCode = 404;
    			error.code = 'MODEL_NOT_FOUND';
				return next(error);
			}

			Sphere.downloadFile(location.sphereId, location.imageId, res, next);
		});
	}

	model.remoteMethod(
		'downloadImage',
		{
			http: {path: '/:id/image', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download image of the location"
		}
	);

	model.deleteImage = function(id, next) {
		debug("deleteImage");

		const Sphere = loopback.getModel('Sphere');

		// get the location instance
		model.findById(id, function(err, location) {
			if (err) return next(err);

			if (!location) {
				error = new Error("no location found with this id");
				error.statusCode = 404;
    			error.code = 'MODEL_NOT_FOUND';
				return next(error);
			}

			Sphere.deleteFile(location.sphereId, location.imageId, next);
		});
	}

	model.remoteMethod(
		'deleteImage',
		{
			http: {path: '/:id/image/:fk', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete image of the location"
		}
	);

};
