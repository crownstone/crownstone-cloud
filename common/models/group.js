var loopback = require('loopback');
var uuid = require('node-uuid');
var crypto = require('crypto');

const debug = require('debug')('loopback:dobots');

var util = require('../../server/emails/util');

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
		//   - create new group
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
				"principalId": "$group:owner",
				"permission": "ALLOW"
			}
		);
		//***************************
		// MEMBER:
		//   - everything except:
		//   	- delete location(s)
		//   	- remove users
		//   	- delete group
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

	/************************************
	 **** Model Validation
	 ************************************/

	model.validatesUniquenessOf('name', {scopedTo: ['ownerId'], message: 'a group with this name was already added'});
	model.validatesUniquenessOf('uuid', {message: 'a group with this UUID was already added'});

	/************************************
	 **** Verification checks
	 ************************************/

	// check that the owner of a group can't unlink himself from the group, otherwise there will
	// be access problems to the group. And a group should never be without an owner.
	model.beforeRemote('*.__unlink__users', function(context, user, next) {

		const User = loopback.findModel('user');
		User.findById(context.args.fk, function(err, user) {
			if (err) return next(err);
			if (!user) return next();

			if (new String(user.id).valueOf() === new String(context.instance.ownerId).valueOf()) {
				error = new Error("can't remove owner from group");
				return next(error);
			} else {
				next();
			}
		})
	});

	// check that a group is not deleted as long as there are crownstones assigned
	model.observe('before delete', function(context, next) {

		model.countOwnedStones(context.where.id, function(err, count) {
			if (count > 0) {
				error = new Error("Can't delete a group with assigned crownstones.")
				next(error);
			} else {
				next();
			}
		});
	});

	/************************************
	 **** Cascade
	 ************************************/

	// if the group is deleted, delete also all files stored for this group
	model.observe('after delete', function(context, next) {
		model.deleteAllFiles(context.where.id, function() {
			next();
		});
	});

	/************************************
	 **** Custom
	 ************************************/

	function initGroup(ctx, next) {
		debug("initGroup");

		if (ctx.isNewInstance) {
			injectUUID(ctx.instance);
			injectEncryptionKeys(ctx.instance);
			injectOwner(ctx.instance, next);
		} else {
			injectUUID(ctx.data);
			injectEncryptionKeys(ctx.data);
			injectOwner(ctx.data, next);
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

		if (!item.ownerEncryptionKey) {
			item.ownerEncryptionKey = createKey();
		}
		if (!item.memberEncryptionKey) {
			item.memberEncryptionKey = createKey();
		}
		if (!item.guestEncryptionKey) {
			item.guestEncryptionKey = createKey();
		}

		// createKey(function(err, ownerKey) {
		// 	if (!item.ownerEncryptionKey) {
		// 		if (err) return next(err);
		// 		item.ownerEncryptionKey = ownerKey;
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

	model.observe('before save', initGroup);
	// model.beforeRemote('create', injectOwner);
	// model.beforeRemote('upsert', injectOwner);

	function updateOwnerAccess(ctx, next) {
		debug("instance: ", ctx.instance);

		// const GroupAccess = loopback.getModel('GroupAccess');
		// GroupAccess.create({
		// 	groupId: instance.id,
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

				addGroupAccess(user, ctx.instance, "owner",
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

	// 		addGroupAccess(res.id, ctx.instance.id, "admin",
	// 			function(err, res) {

	// 			}
	// 		);
	// 	})

	// }

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

	function addGroupAccess(user, group, access, cb) {
		debug("addGroupAccess");

		group.users.add(user, {
			groupId: group.id,
			userId: user.id,
			role: access
		},
		function(err, access) {
			debug("err", err);
			debug("access", access);
			cb(err);
		})

		// const GroupAccess = loopback.getModel('GroupAccess');
		// GroupAccess.create({
		// 	groupId: groupId,
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

	function addUser(email, id, access, cb) {
		const User = loopback.getModel('user');
		model.findById(id, function(err, instance) {
			if (err) {
				cb(err, null);
			} else {
				var group = instance;
				if (group) {
					debug("group:", group);
					var encryptionKey = group[access + "EncryptionKey"];

					User.findOne({where: {email: email}}, function(err, user) {
						if (err) {
							debug("did not find user with this email");
							cb(err);
						} else {
							if (user) {
								debug("user:", user);
								addGroupAccess(user, group, access, cb);
							} else {
								error = new Error("no user found with this email");
								cb(error);
							}
						}
					});
				} else {
					error = new Error("no group found with this id");
					cb(error);
				}
			}
		});
	};

	model.addGuest = function(email, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		addUser(email, id, "guest", cb);
	};

	model.remoteMethod(
		'addGuest',
		{
			http: {path: '/:id/guests', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', required: true},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Add an existing user as a member to this group"
		}
	);

	model.addMember = function(email, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		addUser(email, id, "member", cb);
	};

	model.remoteMethod(
		'addMember',
		{
			http: {path: '/:id/members', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', required: true},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Add an existing user as a guest to this group"
		}
	);

	function createUser(data, id, access, cb) {
		// debug("email:", email);
		// debug("password:", password);
		// debug("id:", id);
		// debug("access:", access);

		model.findById(id, function(err, instance) {
			if (err) {
				cb(err, null);
			} else {
				var group = instance;
				if (group) {
					debug("group:", group);
					var encryptionKey = group[access + "EncryptionKey"];

					const user = loopback.getModel('user');
					user.create(data, function(err, instance) {
						if (err) {
							cb(err);
						} else {
							debug("user created:", instance);
							user.sendVerification(instance, function() {});
							addGroupAccess(instance, group, access, cb);
						}
					})
				} else {
					error = new Error("no group found with this id");
					cb(error);
				}
			}
		});
	};

	model.createNewGuest = function(data, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		createUser(data, id, "guest", cb);
	};

	model.remoteMethod(
		'createNewGuest',
		{
			http: {path: '/:id/guests', verb: 'post'},
			accepts: [
				{arg: 'data', type: 'user', required: true, http: { source : 'body' }},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Create a new user and make it a guest of this group"
		}
	);

	model.createNewMember = function(data, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		createUser(data, id, "member", cb);
	};

	model.remoteMethod(
		'createNewMember',
		{
			http: {path: '/:id/members', verb: 'post'},
			accepts: [
				{arg: 'data', type: 'user', required: true, http: { source : 'body' }},
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Create a new user and make it a member of this group"
		}
	);

	function findUsersWithRole(id, access, cb) {

		model.findById(id, function(err, instance) {
			if (err) return cb(err);

			// instance.users({where: {role: "member"}}, cb);
			instance.users(function(err, users) {
				if (err) return cb(err);

				// debug("users:", users);

				const GroupAccess = loopback.getModel('GroupAccess');
				GroupAccess.find(
					{where: {and: [{groupId: id}, {role: access}]}, field: "userId"},
					function(err, res) {
						if (err) return cb(err);

						// debug("groupMembers:", res);

						var members = [];
						for (i = 0; i < users.length; ++i) {
							var user = users[i];
							// debug("  user.id " + i + ":", user.id.valueOf() );
							for (j = 0; j < res.length; ++j) {
								member = res[j];
								// debug("member.id " + j + ":", member.userId.valueOf());
								if (new String(user.id).valueOf() === new String(member.userId).valueOf()) {
									members.push(user);
									break;
								}
							}
						}
						debug("found members: ", members);
						cb(null, members);
					}
				);
			});
		});
	}

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
			description: "Queries members of Group"
		}
	);

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
			description: "Queries guests of Group"
		}
	);

	// model.beforeRemote('*.__get__users', function(ctx, instance, next) {
	// 	debug("ctx:", ctx);
	// 	next();
	// });

	model.ownedStones = function(id, cb) {

		var Stone = loopback.getModel('Stone');
		Stone.find({where: {"groupId": id}}, function(err, stones) {
			if (err) return cb(err);
			cb(null, stones);
		});

	}

	model.remoteMethod(
		'ownedStones',
		{
			http: {path: '/:id/ownedStones', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'data', type: ['Stone'], root: true},
			description: "Queries stones owned by Group"
		}
	);

	model.countOwnedStones = function(id, cb) {

		model.ownedStones(id, function(err, stones) {
			if (err) return cb(err);

			cb(null, stones.length);
		})
	}

	model.remoteMethod(
		'countOwnedStones',
		{
			http: {path: '/:id/ownedStones/count', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			returns: {arg: 'count', type: 'number'},
			description: "Counts ownedStones of Group"
		}
	);



	/************************************
	 **** Container Methods
	 ************************************/

	model.listFiles = function(id, cb) {
		const Container = loopback.getModel('GroupContainer');
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
			description: "Queries files of Group"
		}
	);

	model.countFiles = function(id, cb) {
		const Container = loopback.getModel('GroupContainer');
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
			description: "Count files of Group"
		}
	);

	// model.listFile = function(id, fk, cb) {
	// 	const Container = loopback.getModel('GroupContainer');
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
		const Container = loopback.getModel('GroupContainer');
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
		const Container = loopback.getModel('GroupContainer');
		Container._deleteContainer(id, cb);
	}

	model.remoteMethod(
		'deleteAllFiles',
		{
			http: {path: '/:id/files', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete all files of Group"
		}
	);

	model.downloadFile = function(id, fk, res, cb) {
		const Container = loopback.getModel('GroupContainer');
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
		const Container = loopback.getModel('GroupContainer');
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
			description: "Upload a file to Group"
		}
	);

	model.downloadProfilePicOfUser = function(id, email, res, cb) {
		model.findById(id, function(err, group) {
			if (err) return next(err);
			if (!group) return cb(new Error("group not found"));

			group.users({where: {email: email}}, function(err, users) {
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

	/************************************
	 **** Sending Emails
	 ************************************/

	model.afterRemote("*.__unlink__users", function(context, instance, next) {
		// do not need to wait for result of email
		next();

		const User = loopback.findModel('user');
		User.findById(context.args.fk, function(err, user) {
			if (err || !user) return debug("did not find user to send notification email");
			util.sendRemovedFromGroupEmail(user, context.instance, next);
		});
	});

	model.afterRemote("*.__link__users", function(context, instance, next) {
		// do not need to wait for result of email
		next();

		const User = loopback.findModel('user');
		User.findById(context.args.fk, function(err, user) {
			if (err || !user) return debug("did not find user to send notification email");
			util.sendAddedToGroupEmail(user, context.instance, next);
		});
	});

	model.afterRemote("addMember", function(context, instance, next) {
		// do not need to wait for result of email
		next();

		const User = loopback.findModel('user');
		User.findOne({where: {email: context.args.email}}, function(err, user) {
			if (err || !user) return debug("did not find user to send notification email");

			model.findById(context.args.id, function(err, group) {
				if (err || !group) return debug("did not find group to send notification email");
				util.sendAddedToGroupEmail(user, group, next);
			});
		});
	});

	model.afterRemote("addGuest", function(context, instance, next) {
		// do not need to wait for result of email
		next();

		const User = loopback.findModel('user');
		User.findOne({where: {email: context.args.email}}, function(err, user) {
			if (err || !user) return debug("did not find user to send notification email");

			model.findById(context.args.id, function(err, group) {
				if (err || !group) return debug("did not find group to send notification email");
				util.sendAddedToGroupEmail(user, group, next);
			});
		});
	});

};
