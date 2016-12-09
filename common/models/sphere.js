var loopback = require('loopback');
var uuid = require('node-uuid');
var crypto = require('crypto');

const debug = require('debug')('loopback:dobots');

var config = require('../../server/config.json');
var emailUtil = require('../../server/emails/util');
var mesh = require('../../server/middleware/mesh-access-address')

var DEFAULT_TTL = 1209600; // 2 weeks in seconds
var DEFAULT_MAX_TTL = 31556926; // 1 year in seconds

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {
		model.disableRemoteMethod('find', true);

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
		// AUTHENTICATED:
		//   - create new sphere
		//***************************
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$authenticated",
				"permission": "ALLOW",
				"property": "create"
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
				"principalId": "$owner",
				"permission": "ALLOW"
			}
		);

		//***************************
		// ADMIN:
		//   - everything
		//***************************
		model.settings.acls.push(
			{
				"accessType": "*",
				"principalType": "ROLE",
				"principalId": "$group:admin",
				"permission": "ALLOW"
			}
		);
		// model.settings.acls.push(
		// 	{
		// 		"principalType": "ROLE",
		// 		"principalId": "$group:admin",
		// 		"permission": "DENY",
		// 		"property": "changeOwnership"
		// 	}
		// );

		//***************************
		// MEMBER:
		//   - everything except:
		//   	- delete location(s)
		//   	- remove users
		//   	- delete sphere
		//   	- delete file(s)
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
				"property": "__destroyById__ownedLocations"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__destroyById__ownedAppliances"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__destroyById__ownedStones"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__unlink__users"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__delete__ownedLocations"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__delete__ownedAppliances"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "__delete__ownedStones"
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
				"property": "deleteFile"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "deleteAllFiles"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "ALLOW",
				"property": "downloadProfilePicOfUser"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "changeRole"
			}
		);
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:member",
				"permission": "DENY",
				"property": "changeOwnership"
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
		model.settings.acls.push(
			{
				"principalType": "ROLE",
				"principalId": "$group:guest",
				"permission": "ALLOW",
				"property": "downloadProfilePicOfUser"
			}
		);
	}

	model.disableRemoteMethod('findOne', true);
	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('count', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__create__users', false);
	model.disableRemoteMethod('__delete__users', false);
	model.disableRemoteMethod('__destroyById__users', false);
	model.disableRemoteMethod('__updateById__users', false);
	model.disableRemoteMethod('__link__users', false);
	model.disableRemoteMethod('__count__users', false);
	model.disableRemoteMethod('__get__users', false);

	model.disableRemoteMethod('__delete__ownedLocations', false);
	model.disableRemoteMethod('__delete__ownedStones', false);
	model.disableRemoteMethod('__delete__ownedAppliances', false);

	/************************************
	 **** Model Validation
	 ************************************/

	model.validatesUniquenessOf('name', {scopedTo: ['ownerId'], message: 'a sphere with this name was already added'});
	model.validatesUniquenessOf('uuid', {message: 'a sphere with this UUID was already added'});

	/************************************
	 **** Verification checks
	 ************************************/

	// check that the owner of a sphere can't unlink himself from the sphere, otherwise there will
	// be access problems to the sphere. And a sphere should never be without an owner.
	model.beforeRemote('*.__unlink__users', function(context, user, next) {

		const User = loopback.findModel('user');
		User.findById(context.args.fk, function(err, user) {
			if (err) return next(err);
			if (!user) return next();

			if (new String(user.id).valueOf() === new String(context.instance.ownerId).valueOf()) {
				error = new Error("can't remove owner from sphere");
				return next(error);
			} else {
				next();
			}
		})
	});

	// check that a sphere is not deleted as long as there are crownstones assigned
	model.observe('before delete', function(context, next) {

		model.findById(context.where.id, {include: 'ownedStones'}, function(err, sphere) {

			if (sphere) {
				if (sphere.ownedStones().length > 0) {
					error = new Error("Can't delete a sphere with assigned crownstones.")
					return next(error);
				}
			}
			next();
		});
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
	 **** Custom
	 ************************************/

	function initSphere(ctx, next) {
		debug("initSphere");
		debug("ctx", ctx);

		if (ctx.isNewInstance) {
			injectUUID(ctx.instance);
			injectEncryptionKeys(ctx.instance);
			injectMeshAccessAddress(ctx.instance);
			injectOwner(ctx.instance, next);
		} else {
			// injectUUID(ctx.data);
			// injectEncryptionKeys(ctx.data);
			// injectOwner(ctx.data, next);

			// disallow changing the owner when updating the sphere
			// so always overwrite the ownerId with the current ownerId
			if (ctx.data && ctx.currentInstance) {
				ctx.data.ownerId = ctx.currentInstance.ownerId;
			}
			next();
		}
	}

	function injectUUID(item) {
		if (!item.uuid) {
			debug("create uuid");
			item.uuid = uuid.v4();
		}
	}

	function createKey(cb) {
		return crypto.randomBytes(16).toString('hex');
		// crypto.randomBytes(16, function(err, buf) {
		// 	if (err) return cb(err);
		// 	if (!buf) {
		// 		var error = new Error("could not generate encryption key");
		// 		error.code = 'ENCRYPTION_KEY_GENERATION_FAILED';
		// 		cb(error);
		// 	}

		// 	cb(null, buf.toString('hex'));
		// })
	}

	function injectEncryptionKeys(item, next) {

		if (!item.adminEncryptionKey) {
			item.adminEncryptionKey = createKey();
		}
		if (!item.memberEncryptionKey) {
			item.memberEncryptionKey = createKey();
		}
		if (!item.guestEncryptionKey) {
			item.guestEncryptionKey = createKey();
		}

		// createKey(function(err, ownerKey) {
		// 	if (!item.adminEncryptionKey) {
		// 		if (err) return next(err);
		// 		item.adminEncryptionKey = ownerKey;
		// 	}

		// 	createKey(function(err, memberKey) {
		// 		if (!item.memberEncryptionKey) {
		// 			if (err) return next(err);
		// 			item.memberEncryptionKey = memberKey;
		// 		}

		// 		createKey(function(err, guestKey) {
		// 			if (!item.getEncryptionKeys) {
		// 				if (err) return next(err);
		// 				item.guestEncryptionKey = guestKey;
		// 			}
		// 			next();
		// 		})
		// 	});
		// });

	}

	function injectMeshAccessAddress(item, next) {
		if (!item.meshAccessAddress) {
			item.meshAccessAddress = mesh.generateAccessAddress();
		}
	}

	model.observe('before save', initSphere);
	// model.beforeRemote('create', injectOwner);
	// model.beforeRemote('upsert', injectOwner);

	function afterSave(ctx, next) {
		updateOwnerAccess(ctx, next);
		// addSuperUser(ctx)
	}

	// model.afterRemote('create', updateOwnerAccess);
	model.observe('after save', afterSave);

	model.beforeRemote('**', function(ctx, instance, next) {
		debug("method.name: ", ctx.method.name);
		next();
	});

	// model.beforeRemote('*.__get__users', function(ctx, instance, next) {
	// 	debug("ctx:", ctx);
	// 	next();
	// });

	/************************************
	 **** Membership Methods
	 ************************************/

	function injectOwner(item, next) {
		if (!item.ownerId) {
			debug("injectOwner");
			debug("ctx.instance: ", item);

			const loopbackContext = loopback.getCurrentContext();
			var currentUser = loopbackContext.get('currentUser');

			inject = function(item, user, next) {
				debug("user:", user);
				item.ownerId = user.id;
				debug("ctx.instance: ", item.instance);
				next();
			}

			// only for DEBUG purposes
			if (currentUser == null) {

				const User = loopback.getModel('user');
				User.findOne({where: {email: "dominik@dobots.nl"}}, function(err, currentUser) {
					if (err) {
						debug("fatal error");
					} else {
						inject(item, currentUser, next);
					}
				})
			} else {
				inject(item, currentUser, next)
			}
		} else {
			next();
		}
	};

	function updateOwnerAccess(ctx, next) {
		debug("instance: ", ctx.instance);

		// const SphereAccess = loopback.getModel('SphereAccess');
		// SphereAccess.create({
		// 	sphereId: instance.id,
		// 	userId: instance.ownerId,
		// 	role: "owner"
		// }, function(err, res) {
		// 	if (err) {
		// 		debug("Error: ", err);
		// 	} else {
		// 		debug("OK");
		// 	}
		// });

		if (ctx.isNewInstance) {
			const User = loopback.getModel('user');
			User.findById(ctx.instance.ownerId, function(err, user) {
				if (err) return next(err);

				// make the owner admin of the group
				addSphereAccess(user, ctx.instance, "admin", false,
					function(err, res) {

					}
				);
			})
		}

		next();
	};

	// var addSuperUser = function(ctx) {

	// 	user = loopback.getModel('user');
	// 	user.findOne({where: {role: "superuser"}}, function(err, res) {
	// 		if (err || !res) return debug("failed to find superuser");

	// 		addSphereAccess(res.id, ctx.instance.id, "admin", true,
	// 			function(err, res) {

	// 			}
	// 		);
	// 	})

	// }

	function addSphereAccess(user, sphere, access, invite, cb) {
		debug("addSphereAccess");

		sphere.users.add(user, {
			sphereId: sphere.id,
			userId: user.id,
			role: access,
			invitePending: invite
		},
		function(err, access) {
			debug("err", err);
			debug("access", access);
			cb(err);
		})

		// const SphereAccess = loopback.getModel('SphereAccess');
		// SphereAccess.create({
		// 	sphereId: sphereId,
		// 	userId: userId,
		// 	role: access
		// }, function(err, res) {
		// 	if (err) {
		// 		debug("Error: ", err);
		// 		cb(err);
		// 	} else {
		// 		debug("OK");
		// 		cb();
		// 	}
		// });
	};

	function sendInvite(user, sphere, isNew, accessTokenId) {

		var baseUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port));
		if (isNew) {
			var acceptUrl = baseUrl + '/profile-setup'
			var declineUrl = baseUrl + '/decline-invite-new'

			emailUtil.sendNewUserInviteEmail(sphere, user.email, acceptUrl, declineUrl, accessTokenId);
		} else {
			var acceptUrl = baseUrl + '/accept-invite'
			var declineUrl = baseUrl + '/decline-invite'

			emailUtil.sendExistingUserInviteEmail(user, sphere, acceptUrl, declineUrl);
		}
	}

	function addExistingUser(email, id, access, cb) {
		const User = loopback.getModel('user');
		model.findById(id, function(err, instance) {
			if (err) {
				cb(err, null);
			} else {
				var sphere = instance;
				if (sphere) {
					debug("sphere:", sphere);
					// var encryptionKey = sphere[access + "EncryptionKey"];

					User.findOne({where: {email: email}}, function(err, user) {
						if (err) {
							debug("did not find user with this email");
							cb(err);
						} else {
							if (user) {
								debug("user:", user);
								// user.invitePending = id;
								// user.save();

								addSphereAccess(user, sphere, access, true, function(err) {
									if (err) return cb(err);

									// var acceptUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/accept-invite'
									// var declineUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/decline-invite'

									// emailUtil.sendExistingUserInviteEmail(user, sphere, acceptUrl, declineUrl);
									sendInvite(user, sphere, false);
									cb();
								});
							} else {
								error = new Error("no user found with this email");
								cb(error);
							}
						}
					});
				} else {
					debug("no sphere", sphere, sphereId)
					error = new Error("no sphere found with this id");
					cb(error);
				}
			}
		});
	};

	function createAndInviteUser(sphere, email, access, next) {

		debug("createAndInviteUser");

		const User = loopback.getModel('user');
		tempPassword = crypto.randomBytes(8).toString('base64');
		debug("tempPassword", tempPassword);
		userData = {email: email, password: tempPassword};
		User.create(userData, function(err, user) {
			if (err) return next(err);

			var ttl = DEFAULT_TTL;
			user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
				if (err) return next(err);

				addSphereAccess(user, sphere, access, true, function(err) {
					if (err) return next(err);

					// var acceptUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/profile-setup'
					// var declineUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/decline-invite-new'
					// emailUtil.sendNewUserInviteEmail(sphere, email, acceptUrl, declineUrl, accessToken.id);
					sendInvite(user, sphere, true, accessToken.id);
					next();
				});
			});
		});
	}

	function invite(sphereId, email, access, next) {

		model.findById(sphereId, function(err, sphere) {
			if (err) return next(err);

			debug("sphere", sphere);

			if (sphere) {
				const User = loopback.getModel('user');
				User.findOne({where: {email: email}}, function(err, user) {
					if (err) return next(err);

					if (!user) {
						debug("create new user")
						createAndInviteUser(sphere, email, access, next);
					} else {
						// user exists, check if he is already part of the sphere
						sphere.users.exists(user.id, function(err, exists) {
							if (exists) {
								debug("user is already part of the sphere")
								error = new Error("user is already part of the sphere");
	    						error.statusCode = error.status = 200;
	    						next(error);
							} else {
								debug("add existing user")
								addExistingUser(email, sphereId, access, next);
							}
						})

					}
				});
			} else {
				debug("no sphere");
				error = new Error("no sphere found with this id");
				next(error);
			}
		});
	};

	model.pendingInvites = function(id, cb) {

		const SphereAccess = loopback.getModel('SphereAccess');
		SphereAccess.find(
			{where: {and: [{sphereId: id}, {invitePending: true}]}, include: "user"},
			function(err, objects) {
				if (err) return cb(err);

				// [06.12.16] Bug? access.user() was null and app crashed on access.user().email
				//   shouldn't happen?! But to avoid future crashes, array is first filtered for
				//   elements where access.user() returns a user object
				pendingInvites = Array.from(objects)
					.filter(function(access) {
						return (access.user())
					})
					.map(function(access) {
						return {role: access.role, email: access.user().email};
					});
				debug("pendingInvites", pendingInvites);

				cb(null, pendingInvites);
			}
		);
	}

	model.remoteMethod(
		'pendingInvites',
		{
			http: {path: '/:id/pendingInvites', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'users', type: ['any'], root: true},
			description: "Get pending invites of Sphere"
		}
	);

	model.resendInvite = function(id, email, cb) {

		model.findById(id, function(err, sphere) {
			if (err) return cb(err);

			const User = loopback.findModel('user');
			User.findOne({where: {email: email}}, function(err, user) {
				if (err) return cb(err);
				debug("user", user);

				const SphereAccess = loopback.getModel('SphereAccess');
				SphereAccess.findOne(
					{where: {and: [{sphereId: id}, {userId: user.id}, {invitePending: true}]}},
					function(err, access) {
						if (err) return cb(err);
						if (!access) return cb(new Error("User not found in invites"));

						if (user.new) {
							user.accessTokens.destroyAll(function(err, info) {
								if (err) debug("failed to remove old access token");

								var ttl = DEFAULT_TTL;
								user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
									if (err) return cb(err);

									sendInvite(user, sphere, true, accessToken.id);
									cb();
								});

							})
						} else {
							sendInvite(user, sphere, false);
						}

						cb();
					}
				);
			});
		});
	}

	model.remoteMethod(
		'resendInvite',
		{
			http: {path: '/:id/resendInvite', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }}
			],
			description: "Resend invite to User of Sphere"
		}
	);

	model.removeInvite = function(id, email, cb) {

		const User = loopback.findModel('user');
		User.findOne({where: {email: email}}, function(err, user) {
			if (err) return cb(err);
			if (!user) return cb(new Error("could not find user with this email"));

			const SphereAccess = loopback.getModel('SphereAccess');
			SphereAccess.findOne(
				{where: {and: [{sphereId: id}, {userId: user.id}, {invitePending: true}]}},
				function(err, access) {
					if (err) return cb(err);
					if (!access) return cb(new Error("could not find user in invites"));

					SphereAccess.deleteById(access.id, cb);
				}
			);
		});
	}

	model.remoteMethod(
		'removeInvite',
		{
			http: {path: '/:id/removeInvite', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }}
			],
			description: "Remove invite for user of Sphere"
		}
	);



	model.addGuest = function(email, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		invite(id, email, "guest", cb);
	};

	model.remoteMethod(
		'addGuest',
		{
			http: {path: '/:id/guests', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', required: true},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Add an existing user as a member to this sphere"
		}
	);

	model.addMember = function(email, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		invite(id, email, "member", cb);
	};

	model.remoteMethod(
		'addMember',
		{
			http: {path: '/:id/members', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', required: true},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Add an existing user as a guest to this sphere"
		}
	);

	model.addAdmin = function(email, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		invite(id, email, "admin", cb);
	};

	model.remoteMethod(
		'addAdmin',
		{
			http: {path: '/:id/admins', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', required: true},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Add an existing user as an admin to this sphere"
		}
	);

	model.beforeRemote("*.__get__users", function(context, instance, next) {
		// do not need to wait for result of email
		// filter = {invitePending: {neq: true}}
		// const where = context.args.filter ? {
  //         and: [ context.args.filter, filter ]
  //       } : filter;

		// debug("context.args before", context.args);

  //       context.args.filter = where;

		debug("context.args", context.args);
		// debug("instance", instance);
		next();
	});

	function findUsersWithRole(id, access, cb) {

		model.findById(id, function(err, instance) {
			if (err) return cb(err);
			if (model.checkForNullError(instance, cb, "id: " + id)) return;

			// instance.users({where: {role: "member"}}, cb);
			instance.users(function(err, users) {
				if (err) return cb(err);

				// debug("users:", users);

				const SphereAccess = loopback.getModel('SphereAccess');
				SphereAccess.find(
					{where: {and: [{sphereId: id}, {role: access}, {invitePending: {neq: true}}]}, field: "userId"},
					function(err, res) {
						if (err) return cb(err);

						// debug("sphereMembers:", res);

						var filteredUsers = [];
						for (i = 0; i < users.length; ++i) {
							var user = users[i];
							// debug("  user.id " + i + ":", user.id.valueOf() );
							for (j = 0; j < res.length; ++j) {
								access = res[j];
								// debug("member.id " + j + ":", member.userId.valueOf());
								if (new String(user.id).valueOf() === new String(access.userId).valueOf()) {
									filteredUsers.push(user);
									break;
								}
							}
						}
						debug("found users: ", filteredUsers);
						cb(null, filteredUsers);
					}
				);
			});
		});
	}

	model.guests = function(id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, 'guest', cb);
	};

	model.remoteMethod(
		'guests',
		{
			http: {path: '/:id/guests', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'data', type: ['user'], root: true},
			description: "Queries guests of Sphere"
		}
	);

	model.members = function(id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, 'member', cb);
	};

	model.remoteMethod(
		'members',
		{
			http: {path: '/:id/members', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'data', type: ['user'], root: true},
			description: "Queries members of Sphere"
		}
	);

	model.admins = function(id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, 'admin', cb);
	};

	model.remoteMethod(
		'admins',
		{
			http: {path: '/:id/admins', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'data', type: ['user'], root: true},
			description: "Queries admins of Sphere"
		}
	);

	model.users = function(id, cb) {
		result = {};
		findUsersWithRole(id, 'admin', function(err, admins) {
			if (err) cb(err);

			result.admins = admins;

			findUsersWithRole(id, 'member', function(err, members) {
				if (err) cb(err);

				result.members = members;

				findUsersWithRole(id, 'guest', function(err, guests) {
					if (err) cb(err);

					result.guests = guests;

					cb(null, result);
				});
			});
		});
	}

	model.remoteMethod(
		'users',
		{
			http: {path: '/:id/users', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'data', type: ['user'], root: true},
			description: "Queries users of Sphere"
		}
	);

	model.countUsers = function(id, cb) {
		model.users(id, function(err, res) {
			if (err) cb(err);

			count = res.admins.length + res.members.length + res.guests.length;
			cb(null, count);
		})
	}

	model.remoteMethod(
		'countUsers',
		{
			http: {path: '/:id/users/count', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'count', type: 'number'},
			description: "Count users of Sphere"
		}
	);

	model.changeOwnership = function(id, email, cb) {

		model.findById(id, function(err, sphere) {
			if (err) return cb(err);

			const User = loopback.findModel('user');
			User.findOne({where: {email: email}}, function(err, user) {
				if (err) return cb(err);
				debug("user", user);
				debug("sphere", sphere);

				const loopbackContext = loopback.getCurrentContext();
				var currentUser = loopbackContext.get('currentUser');

				if (new String(sphere.ownerId).valueOf() === new String(currentUser.id).valueOf()) {

					const SphereAccess = loopback.findModel("SphereAccess");
					SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
						if (err) return cb(err);

						if (objects.length = 1) {
							objects[0].role = "admin";
							objects[0].save(function(err, instance) {
								if (err) return cb(err);

								sphere.ownerId = user.id;
								sphere.save(function(err, inst) {
									if (err) return cb(err);

									cb(null, true);
								});
							});

						} else {
							error = new Error("user is not part of the sphere!");
							return cb(error);
						}
						// for (access of objects) {
						// 	if (access.role in ["member", "guest"]) {
						// 		access.
						// 	}
						// }
					})
				} else {

					debug("Error: Authorization required!");
					error = new Error("Authorization Required");
					error.status = 401;
					return cb(error);
				}

				// SphereAccess.destroyAll({and: [{userId: sphere.ownerId}, {sphereId: id}, {role: "owner"}]}, function(err, info) {
				// 	if (err) return cb(err);
				// 	debug("info", info);

				// 	addSphereAccess(user, sphere, "owner", false, function(err) {
				// 		if (err) return cb(err);

				// 		debug("added sphere access");

				// 		cb(null, true);
				// 	});
				// });
			});
		});
	}

	model.remoteMethod(
		'changeOwnership',
		{
			http: {path: '/:id/owner', verb: 'put'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }}
			],
			returns: {arg: 'success', type: 'boolean', root: true},
			description: "Change owner of Group"
		}
	);

	function verifyChangeRole(sphereId, user, role, cb) {

		model.findById(sphereId, function(err, sphere) {
			if (err) return cb(err);
			if (model.checkForNullError(sphere, cb, "id: " + sphereId)) return;

			if (role === "owner") {
				cb(null, false);
			} else {
				cb(null, user.id != sphere.ownerId)
			}
		});

	}

	model.getRole = function(id, email, cb) {

		const User = loopback.findModel('user');
		User.findOne({where: {email: email}}, function(err, user) {
			if (err) return cb(err);
			if (User.checkForNullError(user, cb, "email: " + email)) return;

			const SphereAccess = loopback.findModel("SphereAccess");
			SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
				if (err) return cb(err);
				debug(objects);
				roles = Array.from(objects, access => access.role)
				cb(null, roles);
			});
		});
	}

	model.remoteMethod(
		'getRole',
		{
			http: {path: '/:id/role', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }}
			],
			returns: {arg: 'role', type: 'string', root: true},
			description: "Get role of User in Sphere"
		}
	);

	model.changeRole = function(id, email, role, cb) {

		const User = loopback.findModel('user');
		User.findOne({where: {email: email}}, function(err, user) {
			if (err) return cb(err);
			if (User.checkForNullError(user, cb, "email: " + email)) return;

			verifyChangeRole(id, user, role, function(err, success) {
				if (err) return cb(err);

				if (success) {
					const SphereAccess = loopback.findModel("SphereAccess");
					// SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
					// 	if (err) return cb(err);
					// 	debug(objects);
					// 	roles = Array.from(objects, access => access.role)
					// 	cb(null, roles);
					// })
					// SphereAccess.updateAll({and: [{userId: user.id}, {sphereId: id}]}, {role: role}, function(err, info) {
					// 	if (err) return cb(err);
					// 	debug(info);
					// 	cb();
					// })
					SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
						if (err) return cb(err);

						if (objects.length = 1) {
							objects[0].role = role;
							objects[0].save(function(err, instance) {
								if (err) return cb(err);
								cb();
							});
						} else {
							error = new Error("user is not part of the sphere!");
							return cb(error);
						}
						// for (access of objects) {
						// 	if (access.role in ["member", "guest"]) {
						// 		access.
						// 	}
						// }
					})
				} else {
					error = new Error("not allowed to change owners. Use /changeOwnership instead!");
					return cb(error);
				}
			});


		});

		// model.findById(id, {include: {relation: "users", scope: {where: {email: email}}}}, function(err, user) {
		// 	if (err) return cb(err);

		// 	const SphereAccess = loopback.findModel("SphereAccess");
		// 	SphereAccess.updateAll({userId: user.id}, {role: role}, function(err, info) {
		// 		if (err) return cb(err);
		// 		debug(info);
		// 		cb();
		// 	})
		// });
	}

	model.remoteMethod(
		'changeRole',
		{
			http: {path: '/:id/role', verb: 'put'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }},
				{arg: 'role', type: 'string', required: true, http: { source : 'query' }}
			],
			description: "Change role of User"
		}
	);


	/************************************
	 **** Container Methods
	 ************************************/

	model.listFiles = function(id, cb) {
		const Container = loopback.getModel('SphereContainer');
		Container._getFiles(id, cb);
	}

	model.remoteMethod(
		'listFiles',
		{
			http: {path: '/:id/files', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'files', type: 'array', root: true},
			description: "Queries files of Sphere"
		}
	);

	model.countFiles = function(id, cb) {
		const Container = loopback.getModel('SphereContainer');
		Container._getFiles(id, function(err, res) {
			if (err) return cb(err);

			cb(null, res.length);
		});
	}

	model.remoteMethod(
		'countFiles',
		{
			http: {path: '/:id/files/count', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'count', type: 'number'},
			description: "Count files of Sphere"
		}
	);

	// model.listFile = function(id, fk, cb) {
	// 	const Container = loopback.getModel('SphereContainer');
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
		const Container = loopback.getModel('SphereContainer');
		Container._deleteFile(id, fk, cb);
	}

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

	model.deleteAllFiles = function(id, cb) {
		const Container = loopback.getModel('SphereContainer');
		Container._deleteContainer(id, cb);
	}

	model.remoteMethod(
		'deleteAllFiles',
		{
			http: {path: '/:id/deleteAllFiles', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete all files of Sphere"
		}
	);

	model.downloadFile = function(id, fk, res, cb) {
		const Container = loopback.getModel('SphereContainer');
		Container._download(id, fk, res, cb);
	}

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
		const Container = loopback.getModel('SphereContainer');
		Container._upload(id, req, cb);
	}

	model.remoteMethod(
		'uploadFile',
		{
			http: {path: '/:id/files', verb: 'post'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'req', type: 'object', http: { source: 'req' }}
			],
			returns: {arg: 'file', type: 'object', root: true},
			description: "Upload a file to Sphere"
		}
	);

	model.downloadProfilePicOfUser = function(id, email, res, cb) {
		model.findById(id, function(err, sphere) {
			if (err) return next(err);
			if (model.checkForNullError(sphere, cb, "id: " + id)) return;

			sphere.users({where: {email: email}}, function(err, users) {
				if (err) return cb(err);

				if (users.length == 0) return cb(new Error("user not found"));
				var user = users[0];

				const User = loopback.getModel('user');
				User.downloadFile(user.id, user.profilePicId, res, cb);
			});
		})
	}

	model.remoteMethod(
		'downloadProfilePicOfUser',
		{
			http: {path: '/:id/profilePic', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download profile pic of User"
		}
	);

	model.deleteAllLocations = function(id, cb) {
		debug("deleteAllLocations");
		model.findById(id, {include: "ownedLocations"}, function(err, sphere) {
			if (err) return cb(err);
			if (model.checkForNullError(sphere, cb, "id: " + id)) return;

			sphere.ownedLocations.destroyAll(function(err) {
				cb(err);
			});
		})
	}

	model.remoteMethod(
		'deleteAllLocations',
		{
			http: {path: '/:id/deleteAllLocations', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			],
			description: "Delete all locations of Sphere"
		}
	);

	model.deleteAllStones = function(id, cb) {
		debug("deleteAllStones");
		model.findById(id, {include: "ownedStones"}, function(err, sphere) {
			if (err) return cb(err);
			if (model.checkForNullError(sphere, cb, "id: " + id)) return;

			sphere.ownedStones.destroyAll(function(err) {
				cb(err);
			});
		})
	}

	model.remoteMethod(
		'deleteAllStones',
		{
			http: {path: '/:id/deleteAllStones', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			],
			description: "Delete all stones of Sphere"
		}
	);

	model.deleteAllAppliances = function(id, cb) {
		debug("deleteAllAppliances");
		model.findById(id, {include: "ownedAppliances"}, function(err, sphere) {
			if (err) return cb(err);
			if (model.checkForNullError(sphere, cb, "id: " + id)) return;

			sphere.ownedAppliances.destroyAll(function(err) {
				cb(err);
			});
		})
	}

	model.remoteMethod(
		'deleteAllAppliances',
		{
			http: {path: '/:id/deleteAllAppliances', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			],
			description: "Delete all appliances of Sphere"
		}
	);

	/************************************
	 **** Sending Emails
	 ************************************/

	model.afterRemote("*.__unlink__users", function(context, instance, next) {
		// do not need to wait for result of email
		next();

		const User = loopback.findModel('user');
		User.findById(context.args.fk, function(err, user) {
			if (err || !user) {
				debug("did not find user to send notification email");
				return next(new Error("did not find user to send notification email"));
			}
			emailUtil.sendRemovedFromSphereEmail(user, context.instance, next);
		});
	});

	// model.afterRemote("*.__link__users", function(context, instance, next) {
	// 	debug("link users");

	// 	// do not need to wait for result of email
	// 	next();

	// 	const User = loopback.findModel('user');
	// 	User.findById(context.args.fk, function(err, user) {
	// 		if (err || !user) return debug("did not find user to send notification email");

	// 		var acceptUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/accept-invite'
	// 		var declineUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/decline-invite'

	// 		emailUtil.sendExistingUserInviteEmail(user, context.instance, acceptUrl, declineUrl);

	// 		// emailUtil.sendAddedToSphereEmail(user, context.instance, next);
	// 	});
	// });

	// model.afterRemote("addMember", function(context, instance, next) {
	// 	// do not need to wait for result of email
	// 	next();

	// 	const User = loopback.findModel('user');
	// 	User.findOne({where: {email: context.args.email}}, function(err, user) {
	// 		if (err || !user) return debug("did not find user to send notification email");

	// 		model.findById(context.args.id, function(err, sphere) {
	// 			if (err || !sphere) return debug("did not find sphere to send notification email");
	// 			emailUtil.sendAddedToSphereEmail(user, sphere, next);
	// 		});
	// 	});
	// });

	// model.afterRemote("addGuest", function(context, instance, next) {
	// 	// do not need to wait for result of email
	// 	next();

	// 	const User = loopback.findModel('user');
	// 	User.findOne({where: {email: context.args.email}}, function(err, user) {
	// 		if (err || !user) return debug("did not find user to send notification email");

	// 		model.findById(context.args.id, function(err, sphere) {
	// 			if (err || !sphere) return debug("did not find sphere to send notification email");
	// 			emailUtil.sendAddedToSphereEmail(user, sphere, next);
	// 		});
	// 	});
	// });

};
