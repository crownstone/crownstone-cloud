// "use strict";

let loopback = require('loopback');
const idUtil = require('./sharedUtil/idUtil');
const debug = require('debug')('loopback:crownstone');
const EventHandler = require('../../server/modules/EventHandler');

module.exports = function(model) {

	let app = require('../../server/server');
	if (app.get('acl_enabled')) {

    model.settings.acls.push(
      {
        "accessType": "READ",
        "principalType": "ROLE",
        "principalId": "$authenticated",
        "permission": "ALLOW",
        "property": "find"
      }
    );

		//***************************
		// GENERAL, ADMIN and OWNER
		//  see sphere-content.js
		//***************************

    model.settings.acls.push(
      {
        "accessType": "EXECUTE",
        "principalType": "ROLE",
        "principalId": "$group:member",
        "permission": "ALLOW"
      }
    );

		//***************************
		// MEMBER:
		//   - everything except:
		//   	- delete scene
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
		//***************************
		model.settings.acls.push(
      {
        "accessType": "READ",
        "principalType": "ROLE",
        "principalId": "$group:guest",
        "permission": "ALLOW"
      }
    );
	}


	model.disableRemoteMethodByName('replaceById');
	model.disableRemoteMethodByName('updateAll');
	model.disableRemoteMethodByName('create');
	model.disableRemoteMethodByName('upsert');
	model.disableRemoteMethodByName('createChangeStream');

  model.disableRemoteMethodByName('prototype.__get__sphere');
  model.disableRemoteMethodByName('prototype.__get__owner');


  /************************************
   **** Cascade
   ************************************/

  // if the location is deleted, delete also all files stored for this sphere
  model.observe('before delete', function(context, next) {
    let sceneId = context.where.id;
    model.deleteImage(sceneId, {}, function() {
      next()
    });
  });

  // if the location is deleted, delete also all files stored for this sphere
  model.observe('before save', function(ctx, next) {
    if (ctx.isNewInstance === false) {
      let instance = ctx.currentInstance;
      let changeData = ctx.data;
      if (changeData.stockPicture && instance.customPictureId) {
        // the user set a stock picture but we have a custom picture. We will delete the custom picture.
        model.deleteImage(instance.id, {}, next);
        return;
      }
      next()
    }
    else {
      next();
    }
  });

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
        scene.stockPicture = null;
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
