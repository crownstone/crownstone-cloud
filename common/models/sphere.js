// "use strict";

let loopback = require('loopback');
let uuid = require('node-uuid');
let crypto = require('crypto');

const debug = require('debug')('loopback:dobots');

let config = require('../../server/config.json');
let emailUtil = require('../../server/emails/util');
let mesh = require('../../server/middleware/mesh-access-address');

let DEFAULT_TTL = 1209600; // 2 weeks in seconds
let DEFAULT_MAX_TTL = 31556926; // 1 year in seconds

module.exports = function(model) {

	let app = require('../../server/server');
	if (app.get('acl_enabled')) {
		model.disableRemoteMethodByName('find');

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

	model.disableRemoteMethodByName('findOne');
	model.disableRemoteMethodByName('updateAll');
	model.disableRemoteMethodByName('count');
	model.disableRemoteMethodByName('upsert');
	model.disableRemoteMethodByName('createChangeStream');

	model.disableRemoteMethodByName('__create__users');
	model.disableRemoteMethodByName('__delete__users');
	model.disableRemoteMethodByName('__destroyById__users');
	model.disableRemoteMethodByName('__updateById__users');
	model.disableRemoteMethodByName('__link__users');
	model.disableRemoteMethodByName('__count__users');
	model.disableRemoteMethodByName('__get__users');

	model.disableRemoteMethodByName('__delete__ownedLocations');
	model.disableRemoteMethodByName('__delete__ownedStones');
	model.disableRemoteMethodByName('__delete__ownedAppliances');

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
				return next(new Error("can't remove owner from sphere"));
			} else {
				next();
			}
		})
	});

	// check that a sphere is not deleted as long as there are crownstones assigned
	model.observe('before delete', function(ctx, next) {
		model.findById(ctx.where.id, {include: 'ownedStones'}, function(err, sphere) {
			if (sphere) {
				if (sphere.ownedStones().length > 0) {
					return next(new Error("Can't delete a sphere with assigned crownstones."));
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
		// debug("ctx", ctx);
    const token = ctx.options && ctx.options.accessToken;
    const userId = token && token.userId;
    const user = userId ? 'user#' + userId : '<anonymous>';
    
		if (ctx.isNewInstance) {
			injectUUID(ctx.instance);
			injectEncryptionKeys(ctx.instance);
			injectMeshAccessAddress(ctx.instance);
			injectOwner(ctx.instance, userId, next);
		} else {
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

	function createKey() {
		return crypto.randomBytes(16).toString('hex');
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

	// model.beforeRemote('**', function(ctx, instance, next) {
	// 	debug("method.name: ", ctx.method.name);
	// 	next();
	// });

	// model.beforeRemote('*.__get__users', function(ctx, instance, next) {
	// 	debug("ctx:", ctx);
	// 	next();
	// });

	/************************************
	 **** Membership Methods
	 ************************************/

	function injectOwner(item, ownerId, next) {
		if (!item.ownerId) {
			debug("injectOwner");
      item.ownerId = ownerId;
      next();
		} else {
			next();
		}
  }
  function updateOwnerAccess(ctx, next) {
		if (ctx.isNewInstance) {
			const User = loopback.getModel('user');
			User.findById(ctx.instance.ownerId, function(err, user) {
				if (err) return next(err);
				// make the owner admin of the group
				addSphereAccess(user, ctx.instance, "admin", false, function(err, res) {
					next(err);
				});
			})
		}
		else {
      next();
		}

  }

	function addSphereAccess(user, sphere, access, invite, callback) {
		debug("addSphereAccess");

		sphere.users.add(user, {
			sphereId: sphere.id,
			userId: user.id,
			role: access,
			invitePending: invite
		},
		function(err, access) {
			callback(err);
		});
  }
  function sendInvite(user, sphere, isNew, accessTokenId) {

		let baseUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port));
		if (isNew) {
			let acceptUrl = baseUrl + '/profile-setup';
			let declineUrl = baseUrl + '/decline-invite-new';

			emailUtil.sendNewUserInviteEmail(sphere, user.email, acceptUrl, declineUrl, accessTokenId);
		} else {
			let acceptUrl = baseUrl + '/accept-invite';
			let declineUrl = baseUrl + '/decline-invite';

			emailUtil.sendExistingUserInviteEmail(user, sphere, acceptUrl, declineUrl);
		}
	}

	function addExistingUser(email, id, access, callback) {
		const User = loopback.getModel('user');
		model.findById(id, function(err, instance) {
			if (err) {
				callback(err, null);
			} else {
				let sphere = instance;
				if (sphere) {
					// debug("sphere:", sphere);
					// let encryptionKey = sphere[access + "EncryptionKey"];

					User.findOne({where: {email: email}}, function(err, user) {
						if (err) {
							debug("did not find user with this email");
							callback(err);
						} else {
							if (user) {
								// debug("user:", user);
								// user.invitePending = id;
								// user.save();

								addSphereAccess(user, sphere, access, true, function(err) {
									if (err) return callback(err);

									// let acceptUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/accept-invite'
									// let declineUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/decline-invite'

									// emailUtil.sendExistingUserInviteEmail(user, sphere, acceptUrl, declineUrl);
									sendInvite(user, sphere, false);
									callback();
								});
							} else {
								callback(new Error("no user found with this email"));
							}
						}
					});
				} else {
					// debug("no sphere", sphere, sphereId)
					callback(new Error("no sphere found with this id"));
				}
			}
		});
  }
  function createAndInviteUser(sphere, email, access, next) {

		debug("createAndInviteUser");

		const User = loopback.getModel('user');
		let tempPassword = crypto.randomBytes(8).toString('base64');
		// debug("tempPassword", tempPassword);
		let userData = {email: email, password: tempPassword};
		User.create(userData, function(err, user) {
			if (err) return next(err);

			let ttl = DEFAULT_TTL;
			user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
				if (err) return next(err);

				addSphereAccess(user, sphere, access, true, function(err) {
					if (err) return next(err);

					// let acceptUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/profile-setup'
					// let declineUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/decline-invite-new'
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

			// debug("sphere", sphere);

			if (sphere) {
				const User = loopback.getModel('user');
				User.findOne({where: {email: email}}, function(err, user) {
					if (err) return next(err);

					if (!user) {
						debug("create new user");
						createAndInviteUser(sphere, email, access, next);
					} else {
						// user exists, check if he is already part of the sphere
						sphere.users.exists(user.id, function(err, exists) {
							if (exists) {
								debug("user is already part of the sphere");
								let error = new Error("user is already part of the sphere");
	    						error.statusCode = error.status = 200;
	    						next(error);
							} else {
								debug("add existing user");
								addExistingUser(email, sphereId, access, next);
							}
						})

					}
				});
			} else {
				debug("no sphere");
				next(new Error("no sphere found with this id"));
			}
		});
  }
  model.pendingInvites = function(id, callback) {

		const SphereAccess = loopback.getModel('SphereAccess');
		SphereAccess.find(
			{where: {and: [{sphereId: id}, {invitePending: true}]}, include: "user"},
			function(err, objects) {
				if (err) return callback(err);

				// [06.12.16] Bug? access.user() was null and app crashed on access.user().email
				//   shouldn't happen?! But to avoid future crashes, array is first filtered for
				//   elements where access.user() returns a user object
				let pendingInvites = Array.from(objects)
					.filter(function(access) {
						return (access.user())
					})
					.map(function(access) {
						return {role: access.role, email: access.user().email};
					});
				// debug("pendingInvites", pendingInvites);

				callback(null, pendingInvites);
			}
		);
	};

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

	model.resendInvite = function(id, email, callback) {

		model.findById(id, function(err, sphere) {
			if (err) return callback(err);

			const User = loopback.findModel('user');
			User.findOne({where: {email: email}}, function(err, user) {
				if (err) return callback(err);
				// debug("user", user);

				const SphereAccess = loopback.getModel('SphereAccess');
				SphereAccess.findOne(
					{where: {and: [{sphereId: id}, {userId: user.id}, {invitePending: true}]}},
					function(err, access) {
						if (err) return callback(err);
						if (!access) return callback(new Error("User not found in invites"));

						if (user.new) {
							user.accessTokens.destroyAll(function(err, info) {
								if (err) debug("failed to remove old access token");

								let ttl = DEFAULT_TTL;
								user.accessTokens.create({ttl: ttl}, function(err, accessToken) {
									if (err) return callback(err);

									sendInvite(user, sphere, true, accessToken.id);
									callback();
								});

							})
						} else {
							sendInvite(user, sphere, false);
						}

						callback();
					}
				);
			});
		});
	};

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

	model.removeInvite = function(id, email, callback) {

		const User = loopback.findModel('user');
		User.findOne({where: {email: email}}, function(err, user) {
			if (err) return callback(err);
			if (!user) return callback(new Error("could not find user with this email"));

			const SphereAccess = loopback.getModel('SphereAccess');
			SphereAccess.findOne(
				{where: {and: [{sphereId: id}, {userId: user.id}, {invitePending: true}]}},
				function(err, access) {
					if (err) return callback(err);
					if (!access) return callback(new Error("could not find user in invites"));

					SphereAccess.deleteById(access.id, callback);
				}
			);
		});
	};

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



	model.addGuest = function(email, id, callback) {
		// debug("email:", email);
		// debug("id:", id);
		invite(id, email, "guest", callback);
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

	model.addMember = function(email, id, callback) {
		// debug("email:", email);
		// debug("id:", id);
		invite(id, email, "member", callback);
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

	model.addAdmin = function(email, id, callback) {
		// debug("email:", email);
		// debug("id:", id);
		invite(id, email, "admin", callback);
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

	function findUsersWithRole(id, access, callback) {
		model.findById(id, function(err, instance) {
			if (err) return callback(err);
			if (model.checkForNullError(instance, callback, "id: " + id)) return;

			// instance.users({where: {role: "member"}}, callback);
			instance.users(function(err, users) {
				if (err) return callback(err);

				// debug("users:", users);

				const SphereAccess = loopback.getModel('SphereAccess');
				SphereAccess.find(
					{where: {and: [{sphereId: id}, {role: access}, {invitePending: {neq: true}}]}, field: "userId"},
					function(err, res) {
						if (err) return callback(err);

						// debug("sphereMembers:", res);

						let filteredUsers = [];
						for (let i = 0; i < users.length; ++i) {
							let user = users[i];
							// debug("  user.id " + i + ":", user.id.valueOf() );
							for (let j = 0; j < res.length; ++j) {
								access = res[j];
								// debug("member.id " + j + ":", member.userId.valueOf());
								if (user.id === access.userId) {
									filteredUsers.push(user);
									break;
								}
							}
						}
						// debug("found users: ", filteredUsers);
						callback(null, filteredUsers);
					}
				);
			});
		});
	}

	model.guests = function(id, callback) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, 'guest', callback);
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

	model.members = function(id, callback) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, 'member', callback);
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

	model.admins = function(id, callback) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, 'admin', callback);
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

	model.users = function(id, callback) {
		let result = {};
		findUsersWithRole(id, 'admin', function(err, admins) {
			if (err) callback(err);

			result.admins = admins;

			findUsersWithRole(id, 'member', function(err, members) {
				if (err) callback(err);

				result.members = members;

				findUsersWithRole(id, 'guest', function(err, guests) {
					if (err) callback(err);

					result.guests = guests;

					callback(null, result);
				});
			});
		});
	};

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

	model.countUsers = function(id, callback) {
		model.users(id, function(err, res) {
			if (err) callback(err);

			let amountOfUsers = res.admins.length + res.members.length + res.guests.length;
			callback(null, amountOfUsers);
		})
	};

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

	model.changeOwnership = function(id, email, options, callback) {
		model.findById(id, function(err, sphere) {
			if (err) return callback(err);

			const User = loopback.findModel('user');
			User.findOne({where: {email: email}}, function(err, user) {
				if (err) return callback(err);
				// debug("user", user);
				// debug("sphere", sphere);
				let currentUserId = options && options.accessToken && options.accessToken.userId;
        if (!currentUserId) {
          return callback("Can not identify user by accessToken.");
        }

				if (sphere.ownerId === currentUserId) {
					const SphereAccess = loopback.findModel("SphereAccess");
					SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
						if (err) return callback(err);

						if (objects.length === 1) {
							objects[0].role = "admin";
							objects[0].save(function(err, instance) {
								if (err) return callback(err);

								sphere.ownerId = user.id;
								sphere.save(function(err, inst) {
									if (err) return callback(err);

									callback(null, true);
								});
							});

						}
						else {
							return callback(new Error("user is not part of the sphere!"));
						}
					})
				} else {
					debug("Error: Authorization required!");
					let error = new Error("Authorization Required");
					error.status = 401;
					return callback(error);
				}
			});
		});
	};

	model.remoteMethod(
		'changeOwnership',
		{
			http: {path: '/:id/owner', verb: 'put'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }},
				{arg: 'email', type: 'string', required: true, http: { source : 'query' }},
        {arg: "options", type: "object", http: "optionsFromRequest"},
			],
			returns: {arg: 'success', type: 'boolean', root: true},
			description: "Change owner of Group"
		}
	);

	function verifyChangeRole(sphereId, user, role, callback) {
		model.findById(sphereId, function(err, sphere) {
			if (err) return callback(err);
			if (model.checkForNullError(sphere, callback, "id: " + sphereId)) return;

			if (role === "owner") {
				callback(null, false);
			} else {
				callback(null, user.id !== sphere.ownerId)
			}
		});
	}

	model.getRole = function(id, email, callback) {
		const User = loopback.findModel('user');
		User.findOne({where: {email: email}}, function(err, user) {
			if (err) return callback(err);
			if (User.checkForNullError(user, callback, "email: " + email)) return;

			const SphereAccess = loopback.findModel("SphereAccess");
			SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
				if (err) return callback(err);
				// debug(objects);
				let roles = Array.from(objects, access => access.role);
				callback(null, roles);
			});
		});
	};

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

	model.changeRole = function(id, email, role, callback) {

		const User = loopback.findModel('user');
		User.findOne({where: {email: email}}, function(err, user) {
			if (err) return callback(err);
			if (User.checkForNullError(user, callback, "email: " + email)) return;

			verifyChangeRole(id, user, role, function(err, success) {
				if (err) return callback(err);

				if (success) {
					const SphereAccess = loopback.findModel("SphereAccess");
					// SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
					// 	if (err) return callback(err);
					// 	debug(objects);
					// 	roles = Array.from(objects, access => access.role)
					// 	callback(null, roles);
					// })
					// SphereAccess.updateAll({and: [{userId: user.id}, {sphereId: id}]}, {role: role}, function(err, info) {
					// 	if (err) return callback(err);
					// 	debug(info);
					// 	callback();
					// })
					SphereAccess.find({where: {and: [{userId: user.id}, {sphereId: id}]}}, function(err, objects) {
						if (err) return callback(err);

						if (objects.length === 1) {
							objects[0].role = role;
							objects[0].save(function(err, instance) {
								if (err) return callback(err);
								callback();
							});
						} else {
							return callback(new Error("user is not part of the sphere!"));
						}
					})
				} else {
					return callback(new Error("not allowed to change owners. Use /changeOwnership instead!"));
				}
			});


		});

		// model.findById(id, {include: {relation: "users", scope: {where: {email: email}}}}, function(err, user) {
		// 	if (err) return callback(err);

		// 	const SphereAccess = loopback.findModel("SphereAccess");
		// 	SphereAccess.updateAll({userId: user.id}, {role: role}, function(err, info) {
		// 		if (err) return callback(err);
		// 		debug(info);
		// 		callback();
		// 	})
		// });
	};

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

	model.listFiles = function(id, callback) {
		const Container = loopback.getModel('SphereContainer');
		Container._getFiles(id, callback);
	};

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

	model.countFiles = function(id, callback) {
		const Container = loopback.getModel('SphereContainer');
		Container._getFiles(id, function(err, res) {
			if (err) return callback(err);

			callback(null, res.length);
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
			description: "Count files of Sphere"
		}
	);

	// model.listFile = function(id, fk, callback) {
	// 	const Container = loopback.getModel('SphereContainer');
	// 	Container.getFile(id, fk, callback);
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

	model.deleteFile = function(id, fk, callback) {
		const Container = loopback.getModel('SphereContainer');
		Container._deleteFile(id, fk, callback);
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

	model.deleteAllFiles = function(id, callback) {
		const Container = loopback.getModel('SphereContainer');
		Container._deleteContainer(id, callback);
	};

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

	model.downloadFile = function(id, fk, res, callback) {
		const Container = loopback.getModel('SphereContainer');
		Container._download(id, fk, res, callback);
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

	model.uploadFile = function(id, req, callback) {
		const Container = loopback.getModel('SphereContainer');
		Container._upload(id, req, callback);
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
			description: "Upload a file to Sphere"
		}
	);

	model.downloadProfilePicOfUser = function(id, email, res, callback) {
		model.findById(id, function(err, sphere) {
			if (err) return next(err);
			if (model.checkForNullError(sphere, callback, "id: " + id)) return;

			sphere.users({where: {email: email}}, function(err, users) {
				if (err) return callback(err);

				if (users.length === 0) return callback(new Error("user not found"));
				let user = users[0];

				const User = loopback.getModel('user');
				User.downloadFile(user.id, user.profilePicId, res, callback);
			});
		})
	};

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

	model.deleteAllLocations = function(id, callback) {
		debug("deleteAllLocations");
		model.findById(id, {include: "ownedLocations"}, function(err, sphere) {
			if (err) return callback(err);
			if (model.checkForNullError(sphere, callback, "id: " + id)) return;

			sphere.ownedLocations.destroyAll(function(err) {
				callback(err);
			});
		})
	};

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

	model.deleteAllStones = function(id, callback) {
		debug("deleteAllStones");
		model.findById(id, {include: "ownedStones"}, function(err, sphere) {
			if (err) return callback(err);
			if (model.checkForNullError(sphere, callback, "id: " + id)) return;

			sphere.ownedStones.destroyAll(function(err) {
				callback(err);
			});
		})
	};

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

	model.deleteAllAppliances = function(id, callback) {
		debug("deleteAllAppliances");
		model.findById(id, {include: "ownedAppliances"}, function(err, sphere) {
			if (err) return callback(err);
			if (model.checkForNullError(sphere, callback, "id: " + id)) return;

			sphere.ownedAppliances.destroyAll(function(err) {
				callback(err);
			});
		})
	};

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

	// 		let acceptUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/accept-invite'
	// 		let declineUrl = 'http://' + (process.env.BASE_URL || (config.host + ':' + config.port)) + '/decline-invite'

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
