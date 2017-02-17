"use strict";

const config = require('../../server/config.json');
const path = require('path');
const loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

const util = require('../../server/emails/util');

module.exports = function(model) {

	///// put the acls by default, since the base model user
	///// already has the ACLs set anyway
	// let app = require('../../server/server');
	// if (app.get('acl_enabled')) {

		//***************************
		// GENERAL:
		//   - nothing
		//   - download user profile pic
		//***************************
		model.settings.acls.push({
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "DENY"
		});
		model.settings.acls.push({
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "ALLOW",
			"property": "resendVerification"
		});
		model.settings.acls.push({
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "ALLOW",
			"property": "resendVerification"
		});
		//***************************
		// AUTHENTICATED:
		//   - create new user
		//   - request own user info
		//***************************
		model.settings.acls.push({
			"principalType": "ROLE",
			"principalId": "$authenticated",
			"permission": "ALLOW",
			"property": "create"
		});
		model.settings.acls.push({
			"principalType": "ROLE",
			"principalId": "$authenticated",
			"permission": "ALLOW",
			"property": "me"
		});
		//***************************
		// OWNER:
		//   - anything on the the users own item
		//***************************
		model.settings.acls.push({
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$owner",
			"permission": "ALLOW"
		});
	// }

	/************************************
	 **** Disable Remote Methods
	 ************************************/

	model.disableRemoteMethod('find', true);
	model.disableRemoteMethod('findOne', true);
	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('exists', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__get__accessTokens', false);
	model.disableRemoteMethod('__create__accessTokens', false);
	model.disableRemoteMethod('__delete__accessTokens', false);
	model.disableRemoteMethod('__count__accessTokens', false);
	model.disableRemoteMethod('__findById__accessTokens', false);
	model.disableRemoteMethod('__destroyById__accessTokens', false);
	model.disableRemoteMethod('__updateById__accessTokens', false);

	model.disableRemoteMethod('__create__currentLocation', false);
	model.disableRemoteMethod('__delete__currentLocation', false);
	model.disableRemoteMethod('__updateById__currentLocation', false);
	model.disableRemoteMethod('__deleteById__currentLocation', false);
	model.disableRemoteMethod('__destroyById__currentLocation', false);
	model.disableRemoteMethod('__count__currentLocation', false);
	model.disableRemoteMethod('__link__currentLocation', false);
	model.disableRemoteMethod('__unlink__currentLocation', false);
	model.disableRemoteMethod('__findById__currentLocation', false);

	model.disableRemoteMethod('__delete__spheres', false);
	model.disableRemoteMethod('__create__spheres', false);
	model.disableRemoteMethod('__updateById__spheres', false);
	model.disableRemoteMethod('__destroyById__spheres', false);
	model.disableRemoteMethod('__link__spheres', false);
	model.disableRemoteMethod('__count__spheres', false);
	model.disableRemoteMethod('__get__spheres', false);

	model.disableRemoteMethod('__delete__devices', false);

	/************************************
	 **** Model Validation
	 ************************************/

	// reserved user roles for special liberties
	model.validatesExclusionOf('role', {in: ['superuser', 'admin', 'lib-user'], allowNull: true});

	// const regex = /^(?=.*\d).{8,}$/; // Password must be at least 8 characters long and include at least one numeric digit.
	// const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,}$/; // Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, one numeric digit, and no spaces.
	// const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)(?=.*[!@#$%^&amp;*()_+}{&quot;:;'?/&gt;.&lt;,]).{8,}$/; // Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, one numeric digit, no spaces, and one special character
	// model.validatesFormatOf('password', {with: regex, message: 'Invalid format. Password needs to be at least 8 characters long and include at least 1 digit'})

	/************************************
	 **** Verification checks
	 ************************************/

	// check that the owner of a sphere can't unlink himself from the sphere, otherwise there will
	// be access problems to the sphere. And a sphere should never be without an owner.
	model.beforeRemote('*.__unlink__spheres', function(context, user, next) {

		const Sphere = loopback.findModel('Sphere');
		Sphere.findById(context.args.fk, function(err, sphere) {
			if (err) return next(err);
			if (!sphere) return next();

			if (new String(sphere.ownerId).valueOf() === new String(context.instance.id).valueOf()) {
				let error = new Error("can't exit from sphere where user with id is the owner");
				return next(error);
			} else {
				next();
			}
		})
	});

	// check that a user is not deleted as long as he is owner of a sphere
	model.observe('before delete', function(context, next) {

		const Sphere = loopback.findModel('Sphere');
		Sphere.find({where:{ownerId: context.where.id}}, function(err, spheres) {
			if (err) return next(err);
			if (spheres.length > 0) {
				let error = new Error("Can't delete user as long as he is owner of a sphere");
				next(error);
			} else {
				next();
			}
		});
	});

	model.afterRemoteError('confirm', function(ctx, next) {
		// debug('confirmation failed!', ctx.error);
		// debug(ctx.res)

		// ctx.req.args.uid

		ctx.res.render('response', {
			title: 'Verification failed',
			content: ctx.error,
			redirectTo: '/resend-verification',
			redirectToLinkText: 'Resend verification'
		});
		// next(null);
		// next();
	});

	/************************************
	 **** Cascade
	 ************************************/

	// if the sphere is deleted, delete also all files stored for this sphere
	model.observe('after delete', function(context, next) {
		model.deleteAllFiles(context.where.id, function() {
			next();
		});
	});

	/************************************
	 **** Custom functions
	 ************************************/

	model.sendVerification = function(user, tokenGenerator, callback) {

		let options = util.getVerificationEmailOptions(user);
		options.generateVerificationToken = tokenGenerator;
		// let options = {
		// 	type: 'email',
		// 	to: user.email,
		// 	from: 'noreply@crownstone.rocks',
		// 	subject: 'Thanks for registering.',
		// 	template: path.resolve(__dirname, '../../server/views/verify.ejs'),
		// 	redirect: '/verified',
		// 	user: user,
		// 	protocol: 'http',
		// 	port: 80,
		// 	generateVerificationToken: func
		// };

		// console.log("options: " + JSON.stringify(options));

		debug("sending verification");
		user.verify(options, callback);
	};

	model.onCreate = function(context, user, callback) {

		if (model.settings.emailVerificationRequired) {
			model.sendVerification(user, null, function(err, response) {
				if (err) return callback(err);

				debug('> verification email sent:', response);
				// todo: return this only if request is coming from website?
				context.res.render('response', {
					title: 'Signed up successfully',
					content: 'Please check your email and click on the verification link ' +
							'before logging in.',
					redirectTo: '/',
					redirectToLinkText: 'Log in'
				});
			})
		} else {
			callback();
		}
	};

	//send verification email after registration
	model.afterRemote('create', function(context, user, next) {
		console.log('> user.afterRemote triggered');
		model.onCreate(context, user, next);
		// next();
	});

	//send password reset link when requested
	model.on('resetPasswordRequest', function(info) {
		let url = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/reset-password';
		let token = info.accessToken.id;
		let email = info.email;
		util.sendResetPasswordRequest(url, token, email);
	});

	model.resendVerification = function(email, callback) {
		model.findOne({where: {email: email}}, function(err, user) {
			if (err) return callback(err);
			if (model.checkForNullError(user, callback, "email: " + email)) return;

			if (!user.emailVerified) {
				if (user.verificationToken) {
					model.sendVerification(user,
						function(user, tokenProvider) {
							tokenProvider(null, user.verificationToken);
						},
						function(err, response) {
							callback(err);
						}
					);
				} else {
					model.sendVerification(user, null, function(err, response) {
						callback(err);
					});
				}
			} else {
				let err = new Error("user already verified");
				err.statusCode = 400;
				err.code = 'ALREADY_VERIFIED';
				callback(err);
			}
		})
	};

	model.remoteMethod(
		'resendVerification',
		{
			http: {path: '/resendVerification', verb: 'post'},
			accepts: {arg: 'email', type: 'string', required: true, 'http': {source: 'query'}},
			description: "Resend verification email"
		}
	);

	model.me = function(cb) {
		// debug("me");
		const loopbackContext = loopback.getCurrentContext();
		let currentUser = loopbackContext.get('currentUser');

		// debug("currentUser", currentUser)
		if (currentUser) {
			cb(null, currentUser);
		} else {
			cb({message: "WTF: user not found??"});
		}
	};

	model.remoteMethod(
		'me',
		{
			http: {path: '/me', verb: 'get'},
			returns: {arg: 'data', type: 'user', root: true},
			description: "Return instance of authenticated User"
		}
	);

	model.createNewSphere = function(data, id, cb) {
		// debug("createNewSphere:", data);
		const Sphere = loopback.getModel('Sphere');
		Sphere.create(data, cb);
	};

	model.remoteMethod(
		'createNewSphere',
		{
			http: {path: '/:id/spheres', verb: 'post'},
			accepts: [
				{arg: 'data', type: 'Sphere', 'http': {source: 'body'}},
				{arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
			],
			returns: {arg: 'data', type: 'Sphere', root: true},
			description: "Creates a new instance in spheres of this model"
		}
	);

	model.spheres = function(id, cb) {

		model.findById(id, function(err, instance) {
			if (err) return cb(err);
			if (model.checkForNullError(instance, cb, "id: " + id)) return;

			instance.spheres(function(err, spheres) {
				if (err) return cb(err);

				// debug("spheres:", spheres);

				const SphereAccess = loopback.getModel('SphereAccess');
				SphereAccess.find(
					{where: {and: [{userId: id}, {invitePending: {neq: true}}]}, field: "sphereId"},
					function(err, res) {
						if (err) return cb(err);

						// debug("sphereMembers:", res);

						let filteredSpheres = [];
						for (let i = 0; i < spheres.length; ++i) {
							let sphere = spheres[i];
							// debug("  sphere.id " + i + ":", sphere.id.valueOf() );
							for (let j = 0; j < res.length; ++j) {
								let access = res[j];
								// debug("member.id " + j + ":", member.sphereId.valueOf());\
                // TODO: check why this check is required
								if (new String(sphere.id).valueOf() === new String(access.sphereId).valueOf()) {
									filteredSpheres.push(sphere);
									break;
								}
							}
						}
						// debug("found spheres: ", filteredSpheres);
						cb(null, filteredSpheres);
					}
				);
			});
		});
	};

	model.remoteMethod(
		'spheres',
		{
			http: {path: '/:id/spheres', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'data', type: ['Sphere'], root: true},
			description: "Queries spheres of user"
		}
	);

	model.countSpheres = function(id, cb) {
		model.spheres(id, function(err, res) {
			if (err) cb(err);
			cb(null, res.length);
		})
	};

	model.remoteMethod(
		'countSpheres',
		{
			http: {path: '/:id/spheres/count', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'count', type: 'number'},
			description: "Count spheres of user"
		}
	);

	model.notifyDevices = function(message, id, cb) {
		// debug("notifyDevices:", message);

		const Notification = loopback.getModel('Notification');
		let notification = new Notification({
			expirationInterval: 3600, // Expires 1 hour from now.
			alert: message,
			message: message,
			messageFrom: 'loopback'
		});

		const Push = loopback.getModel('Push');
		Push.notifyByQuery({userId: id}, notification, cb);

	};

	model.remoteMethod(
		'notifyDevices',
		{
			http: {path: '/:id/notifyDevices', verb: 'post'},
			accepts: [
				{arg: 'message', type: 'string', 'http': {source: 'query'}},
				{arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
			],
			description: "Push notification to all Devices of user"
		}
	);

	/************************************
	 **** Container Methods
	 ************************************/

	model.listFiles = function(id, cb) {
		const Container = loopback.getModel('UserContainer');
		Container._getFiles(id, cb);
	};

	model.remoteMethod(
		'listFiles',
		{
			http: {path: '/:id/files', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'files', type: 'array', root: true},
			description: "Queries files of User"
		}
	);

	model.countFiles = function(id, cb) {
		const Container = loopback.getModel('UserContainer');
		Container._getFiles(id, function(err, res) {
			if (err) return cb(err);

			cb(null, res.length);
		});
	};

	model.remoteMethod(
		'countFiles',
		{
			http: {path: '/:id/files/count', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'count', type: 'number'},
			description: "Count files of User"
		}
	);

	// model.listFile = function(id, fk, cb) {
	// 	const Container = loopback.getModel('UserContainer');
	// 	Container.getFile(id, fk, cb);
	// }

	// model.remoteMethod(
	// 	'listFile',
	// 	{
	// 		http: {path: '/:id/files/:fk', verb: 'get'},
	// 		accepts: [
	// 			{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
	// 			{arg: 'fk', type: 'any', required: true, http: { source : 'path' }}
	// 		],
	// 		returns: {arg: 'file', type: 'object', root: true},
	// 		description: "Queries file by id"
	// 	}
	// );

	model.deleteFile = function(id, fk, cb) {
		const Container = loopback.getModel('UserContainer');
		Container._deleteFile(id, fk, cb);
	};

	model.remoteMethod(
		'deleteFile',
		{
			http: {path: '/:id/files/:fk', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'fk', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete a file by id"
		}
	);

	model.downloadFile = function(id, fk, res, cb) {
		const Container = loopback.getModel('UserContainer');
		Container._download(id, fk, res, cb);
	};

	model.remoteMethod(
		'downloadFile',
		{
			http: {path: '/:id/files/:fk', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'fk', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download a file by id"
		}
	);

	model.uploadFile = function(id, req, cb) {
		const Container = loopback.getModel('UserContainer');
		Container._upload(id, req, cb);
	};

	model.remoteMethod(
		'uploadFile',
		{
			http: {path: '/:id/files', verb: 'post'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'req', type: 'object', http: { source: 'req' }}
			],
			returns: {arg: 'file', type: 'object', root: true},
			description: "Upload a file to User"
		}
	);

	model.uploadProfilePic = function(id, req, callback) {
		// debug("uploadProfilePic");

		let upload = function(user, req) {

			// upload the file
			model.uploadFile(user.id, req, function(err, file) {
				if (err) return callback(err);

				// and set the id as profilePicId
				user.profilePicId = file._id;
				user.save();

				callback(null, file);
			});
		};

		// get the user instance
		model.findById(id, function(err, user) {
			if (err) return callback(err);
			if (model.checkForNullError(user, callback, "id: " + id)) return;

			// if there is already a profile picture uploaded, delete the old one first
			if (user.profilePicId) {
				model.deleteFile(user.id, user.profilePicId, function(err, file) {
					if (err) return callback(err);
					upload(user, req);
				});
			} else {
				upload(user, req);
			}

		});
	};

	model.remoteMethod(
		'uploadProfilePic',
		{
			http: {path: '/:id/profilePic', verb: 'post'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'req', type: 'object', http: { source: 'req' }}
			],
			returns: {arg: 'file', type: 'object', root: true},
			description: "Upload profile pic to User"
		}
	);

	model.downloadProfilePicById = function(id, res, cb) {
		// debug("downloadProfilePicById");

		model.findById(id, function(err, user) {
			if (err) return cb(err);
			if (model.checkForNullError(user, cb, "id: " + id)) return;

			model.downloadFile(id, user.profilePicId, res, cb);
		});
	};

	model.remoteMethod(
		'downloadProfilePicById',
		{
			http: {path: '/:id/profilePic', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download profile pic of User"
		}
	);

	model.deleteProfilePicById = function(id, res, cb) {
		// debug("downloadProfilePicById");

		model.findById(id, function(err, user) {
			if (err) return cb(err);
			if (model.checkForNullError(user, cb, "id: " + id)) return;

			model.deleteFile(id, user.profilePicId, res, cb);
		});
	};

	model.remoteMethod(
		'deleteProfilePicById',
		{
			http: {path: '/:id/profilePic', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete profile pic of User"
		}
	);

	/************************************
	 **** Keys Methods
	 ************************************/

	model.getEncryptionKeys = function(id, cb) {
		const SphereAccess = loopback.getModel('SphereAccess');
		SphereAccess.find({where: {userId: id}, include: "sphere"}, function(err, objects) {
			keys = Array.from(objects, function(access) {
				let el = { sphereId: access.sphereId, keys: {}};
				switch (access.role) {
					case "admin": {
						el.keys.admin = access.sphere().adminEncryptionKey;
					}
					case "member": {
						el.keys.member = access.sphere().memberEncryptionKey;
					}
					case "guest": {
						el.keys.guest = access.sphere().guestEncryptionKey;
					}
				}
				return el
			});
			cb(null, keys);
		});
	};

	model.remoteMethod(
		'getEncryptionKeys',
		{
			http: {path: '/:id/keys', verb: 'get'},
			accepts: {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			returns: {arg: 'data', type: ['object'], root: true},
			description: "Returns encryption keys per Sphere of User"
		}
	);

	/************************************
	 **** Delete ALL functions
	 ************************************/

	model.deleteAllDevices = function(id, cb) {
		debug("deleteAllDevices");
		model.findById(id, {include: "devices"}, function(err, user) {
			if (err) return cb(err);
			if (model.checkForNullError(user, cb, "id: " + id)) return;

			user.devices.destroyAll(function(err) {
				cb(err);
			});
		})
	};

	model.remoteMethod(
		'deleteAllDevices',
		{
			http: {path: '/:id/deleteAllDevices', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			],
			description: "Delete all devices of User"
		}
	);

	model.deleteAllFiles = function(id, cb) {
		debug("deleteAllFiles");
		const Container = loopback.getModel('UserContainer');
		Container._deleteContainer(id, cb);
	};

	model.remoteMethod(
		'deleteAllFiles',
		{
			http: {path: '/:id/deleteAllFiles', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete all files of User"
		}
	);

	model.deleteAllSpheres = function(id, callback) {
		debug("deleteAllSpheres");

		// get a reference to the sphere model which we need to query for stones.
    const sphereModel = loopback.getModel("Sphere");

    // get all spheres from the user
		model.findById(id, {include: "spheres"})
      .then((user) => {
		    let userSpheres = user.spheres();
        if (model.checkForNullError(user, callback, "id: " + id)) return;
        if (userSpheres.length == 0) return callback();

        let promisesPerSphere = [];
        let spheresWithStones = 0;
        let sphereObjectWithStones = {}; // used for error message.
        for (let i = 0; i < userSpheres.length; i++) {
          let sphere = user.spheres()[i];
          promisesPerSphere.push(sphereModel.findById(sphere.id, {include: "ownedStones"})
            .then((sphereData) => {
              let ownedStones = sphereData.ownedStones();
              if (ownedStones.length > 0) {
                spheresWithStones += 1;
                sphereObjectWithStones = sphere;
              }
            })
          );
        }
        return Promise.all(promisesPerSphere).then(() => {
          if (spheresWithStones > 0) {
            throw new Error('Stones detected in sphere ' + sphereObjectWithStones.name + ' (' + sphereObjectWithStones.id + '). Can not delete all Spheres until they all have their stones removed.')
          }
          return userSpheres;
        })
      })
      .then((userSpheres) => {
		    let removalPromises = [];
		    userSpheres.forEach((sphere) => {
          removalPromises.push(sphere.destroy());
        });
		    return Promise.all(removalPromises)
      })
      .then(() => {
        return callback();
      })
      .catch((err) => {
        return callback(err);
      });


        // user.spheres.destroyAll(function(err) {
        // 	cb(err);
        // });
	};

	model.remoteMethod(
		'deleteAllSpheres',
		{
			http: {path: '/:id/deleteAllSpheres', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			],
			description: "Delete all spheres of User"
		}
	);

};
