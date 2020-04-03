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
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__destroyById__messages"
      }
    );
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "DENY",
        "property": "__delete__messages"
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
    model.settings.acls.push(
      {
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW",
        "property": "__create__messages"
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



	/************************************
	 **** Image Methods
	 ************************************/

	model.uploadImage = function(id, req, options, next) {
		debug("uploadImage");

		const Sphere = loopback.getModel('Sphere');

		let upload = function(scene, req, options) {
			// upload the file
			Sphere.uploadFile(scene.sphereId, req, options, function(err, file) {
				if (err) return next(err);

				// and set the id as profilePicId
        scene.customPictureId = file._id;
        scene.save();

				next(null, file);
			});
		};

		// get the scene instance
		model.findById(id, function(err, scene) {
			if (err) return next(err);

			// if there is already an uploaded, delete the old one first
			if (scene.customPictureId) {
				Sphere.deleteFile(scene.sphereId, scene.customPictureId, options, function(err, file) {
					if (err) return next(err);
					upload(scene, req, options);
				});
			}
			else {
				upload(scene, req, options);
			}

		});
	};

	model.remoteMethod(
		'uploadImage',
		{
			http: {path: '/:id/customImage', verb: 'post'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'req', type: 'object', http: { source: 'req' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
			],
			returns: {arg: 'file', type: 'object', root: true},
			description: "Upload custom image to scene"
		}
	);

	model.downloadImage = function(id, res, options, next) {
		debug("downloadImage");

		const Sphere = loopback.getModel('Sphere');

		// get the scene instance
		model.findById(id, function(err, scene) {
			if (err) return next(err);
			if (model.checkForNullError(scene, next, "id: " + id)) return;

			Sphere.downloadFile(scene.sphereId, scene.customPictureId, res, options, next);
		});
	};

	model.remoteMethod(
		'downloadImage',
		{
			http: {path: '/:id/customImage', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
			],
			description: "Download custom image of the scene"
		}
	);

	model.deleteImage = function(id, options, callback) {
		debug("deleteImage");

		const Sphere = loopback.getModel('Sphere');

		// get the scene instance
		model.findById(id, function(err, scene) {
			if (err) return callback(err);
			if (model.checkForNullError(scene, callback, "id: " + id)) return;
      if (idUtil.verifyMongoId(scene.customPictureId) === false) {
        // remove the profile pic
        scene.customPictureId = undefined;
        scene.save()
          .then(() => {
            callback();
          })
      }
      else {
			  Sphere.deleteFile(scene.sphereId, scene.customPictureId, options, (err, result) => {
          if (err) { return callback(err); }

          // remove the profile pic
          scene.customPictureId = undefined;
          scene.save()
            .then(() => {
              callback();
            })
            .catch((err) => {
              callback(err);
            })
        })
      }

		});
	};

	model.remoteMethod(
		'deleteImage',
		{
			http: {path: '/:id/customImage/', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
        {arg: 'options', type: 'object', http: 'optionsFromRequest'},
			],
			description: "Delete custom image of the scene"
		}
	);
};
