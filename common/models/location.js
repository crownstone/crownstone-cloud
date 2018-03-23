// "use strict";

let loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

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
		//   	- delete location
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
	model.disableRemoteMethodByName('upsert');
	model.disableRemoteMethodByName('createChangeStream');

	model.disableRemoteMethodByName('prototype.__create__messages');
	model.disableRemoteMethodByName('prototype.__delete__messages');
	model.disableRemoteMethodByName('prototype.__deleteById__messages');
	model.disableRemoteMethodByName('prototype.__destroyById__messages');
	model.disableRemoteMethodByName('prototype.__updateById__messages');
	model.disableRemoteMethodByName('prototype.__count__messages');

  model.disableRemoteMethodByName('prototype.__get__owner');

	model.disableRemoteMethodByName('prototype.__exists__presentPeople');
	model.disableRemoteMethodByName('prototype.__link__presentPeople');
	model.disableRemoteMethodByName('prototype.__unlink__presentPeople');
	model.disableRemoteMethodByName('prototype.__findById__presentPeople');
	model.disableRemoteMethodByName('prototype.__updateById__presentPeople');
	model.disableRemoteMethodByName('prototype.__unlink__presentPeople');
	model.disableRemoteMethodByName('prototype.__deleteById__presentPeople');
	model.disableRemoteMethodByName('prototype.__destroyById__presentPeople');
	model.disableRemoteMethodByName('prototype.__create__presentPeople');
	model.disableRemoteMethodByName('prototype.__delete__presentPeople');

	model.disableRemoteMethodByName('prototype.__create__stones');
	model.disableRemoteMethodByName('prototype.__exists__stones');
	model.disableRemoteMethodByName('prototype.__delete__stones');
	model.disableRemoteMethodByName('prototype.__updateById__stones');
	model.disableRemoteMethodByName('prototype.__deleteById__stones');
	model.disableRemoteMethodByName('prototype.__destroyById__stones');




  model.observe('before save', initLocation);

  function initLocation(ctx, next) {
    debug("initLocation");
    // debug("ctx", ctx);
    let item = ctx.instance;

    if (item) {
      injectUID(item, next);
    }
    else {
      next();
    }
  }

  function injectUID(item, next) {
    if (!item.uid) {
      // debug("inject uid");

      // To inject a UID, we look for the highest available one. The new one is one higher
      // If this is more than the allowed amount of Locations, we loop over all Locations in the Sphere to check for gaps
      // Gaps can form when Locations are deleted.
      // If all gaps are filled, we throw an error to tell the user that he reached the maximum amount.
      model.find({where: {sphereId: item.sphereId}, order: "uid DESC", limit: "1"})
        .then((result) => {
          if (result.length > 0) {
            let location = result[0];
            if ((location.uid + 1) > 255) {
              injectUIDinGap(item, next);
            }
            else {
              item.uid = location.uid + 1;
              next();
            }
          }
          else {
            item.uid = 1;
            next();
          }
        })
        .catch((err) => {
          next(err);
        })
    }
    else {
      next();
    }
  }

  function injectUIDinGap(item, next) {
    model.find({where: {sphereId: item.sphereId}, order: "uid ASC"})
      .then((fullResults) => {
        let availableUID = 0;
        for (let i = 0; i < fullResults.length; i++) {
          let expectedUID = i+1;
          if (fullResults[i].uid !== expectedUID) {
            availableUID = expectedUID;
            break;
          }
        }

        if (availableUID > 0 && availableUID < 256) {
          item.uid = availableUID;
          next();
        }
        else {
          let err = {
            statusCode: 422,
            name: "ValidationError",
            message: "The maximum number of Locations per Sphere, 255, has been reached. You cannot add another Location without deleting one first."
          };
          throw err;
        }
      })
      .catch((err) => {
        next(err);
      })
  }





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

		let upload = function(location, req) {

			// upload the file
			Sphere.uploadFile(location.sphereId, req, function(err, file) {
				if (err) return next(err);

				// and set the id as profilePicId
				location.imageId = file._id;
				location.save();

				next(null, file);
			});
		};

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
	};

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
			if (model.checkForNullError(location, next, "id: " + id)) return;

			Sphere.downloadFile(location.sphereId, location.imageId, res, next);
		});
	};

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
			if (model.checkForNullError(location, next, "id: " + id)) return;

			Sphere.deleteFile(location.sphereId, location.imageId, {}, next);
		});
	};

	model.remoteMethod(
		'deleteImage',
		{
			http: {path: '/:id/image/:fk', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			],
			description: "Delete image of the location"
		}
	);

};
