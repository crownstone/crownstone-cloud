var loopback = require('loopback');
var uuid = require('node-uuid');

const debug = require('debug')('loopback:dobots');

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

	model.disableRemoteMethod('findOne', true);
	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('count', true);
	model.disableRemoteMethod('upsert', true);
	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__create__users', false);
	model.disableRemoteMethod('__delete__users', false);
	model.disableRemoteMethod('__destroyById__users', false);
	model.disableRemoteMethod('__updateById__users', false);

	var initGroup = function(ctx, next) {
		debug("initGroup");

		if (ctx.isNewInstance) {
			injectUUID(ctx.instance)
			injectOwner(ctx.instance, next)
		} else {
			injectUUID(ctx.data);
			injectOwner(ctx.data, next);
		}
	}

	var injectUUID = function(item) {
		if (!item.uuid) {
			debug("create uuid");
			item.uuid = uuid.v4();
		}
	}

	var injectOwner = function(item, next) {
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

				const user = loopback.getModel('user');
				user.find({where: {email: "dominik@dobots.nl"}}, function(err, res) {
					if (err) {
						debug("fatal error");
					} else {
						currentUser = res[0];
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

	var updateOwnerAccess = function(ctx, next) {
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

		addGroupAccess(ctx.instance.ownerId, ctx.instance.id, "owner",
			function(err, res) {

			}
		);

		next();
	};

	var addSuperUser = function(ctx) {

		user = loopback.getModel('user');
		user.findOne({where: {role: "superuser"}}, function(err, res) {
			if (err || !res) return debug("failed to find superuser");

			addGroupAccess(res.id, ctx.instance.id, "admin",
				function(err, res) {

				}
			);
		})

	}

	var afterSave = function(ctx, next) {
		updateOwnerAccess(ctx, next);
		// addSuperUser(ctx)
	}

	// model.afterRemote('create', updateOwnerAccess);
	model.observe('after save', afterSave);

	model.beforeRemote('**', function(ctx, instance, next) {
		debug("method.name: ", ctx.method.name);
		next();
	});

	var addGroupAccess = function(userId, groupId, access, cb) {
		debug("addGroupAccess");

		const GroupAccess = loopback.getModel('GroupAccess');
		GroupAccess.create({
			groupId: groupId,
			userId: userId,
			role: access
		}, function(err, res) {
			if (err) {
				debug("Error: ", err);
				cb(err);
			} else {
				debug("OK");
				cb();
			}
		});
	};

	var addUser = function(email, id, access, cb) {
		const user = loopback.getModel('user');
		model.findById(id, function(err, instance) {
			if (err) {
				cb(err, null);
			} else {
				var group = instance;
				if (group) {
					debug("group:", group);

					user.find({where: {email: email}}, function(err, res) {
						if (err) {
							debug("did not find user with this email")
							cb(err)
						} else {
							var user = res[0];
							if (user) {
								debug("user:", user);
								addGroupAccess(user.id, group.id, access, cb)
							} else {
								cb({message: "no user found with this email"});
							}
						}
					});
				} else {
					cb({message:"no group found with this id"});
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

	var createUser = function(data, id, access, cb) {
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

					const user = loopback.getModel('user');
					user.create(data, function(err, instance) {
						if (err) {
							cb(err);
						} else {
							debug("user created:", instance);
							user.sendVerification(instance, function() {});
							addGroupAccess(instance.id, group.id, access, cb);
						}
					})
				} else {
					cb({message:"no group found with this id"});
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

	var findUsersWithRole = function(id, access, cb) {

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
		model.findById(id, function(err, group) {
			if (err || !group) return cb("failed to find group for id");

			// debug("group:", group);
			group.ownedLocations({include: 'stones'}, function(err, locations) {
				if (err) return cb("failed to get locations for group");

				// debug("locations:", locations)
				var stones = [];
				for (i = 0; i < locations.length; ++i) {
					// debug("locations[" + i + "]", locations[i]);
					// debug("locations[" + i + "].stones", locations[i].stones());
					stones = stones.concat(locations[i].stones());
				}
				debug("stones:", stones)

				cb(null, stones);
			});
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
		const Container = loopback.getModel('Container');
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
		const Container = loopback.getModel('Container');
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
	// 	const Container = loopback.getModel('Container');
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

	// model.deleteFile = function(id, fk, cb) {
	// 	const Container = loopback.getModel('Container');
	// 	Container.deleteFile(id, fk, cb);
	// }

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
		const Container = loopback.getModel('Container');
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
		const Container = loopback.getModel('Container');
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
		const Container = loopback.getModel('Container');
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



};
