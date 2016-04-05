var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	/* ACL
    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    },
    {
      "accessType": "WRITE",
      "principalType": "ROLE",
      "principalId": "$authenticated",
      "permission": "create"
    },
    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$group:owner",
      "permission": "ALLOW"
    },
    {
      "accessType": "READ",
      "principalType": "ROLE",
      "principalId": "$group:member",
      "permission": "ALLOW"
    },
    {
      "accessType": "READ",
      "principalType": "ROLE",
      "principalId": "$group:guest",
      "permission": "ALLOW"
    }
	*/

	// model.disableRemoteMethod('find', true);
	model.disableRemoteMethod('findOne', true);
	model.disableRemoteMethod('updateAll', true);
	model.disableRemoteMethod('count', true);
	model.disableRemoteMethod('upsert', true);

	model.disableRemoteMethod('__create__users', false);
	model.disableRemoteMethod('__delete__users', false);
	model.disableRemoteMethod('__destroyById__users', false);
	model.disableRemoteMethod('__updateById__users', false);

	model.disableRemoteMethod('createChangeStream', true);

	var injectOwner = function(ctx, next) {
		debug("ctx.instance: ", ctx.instance);

		const loopbackContext = loopback.getCurrentContext();
		var currentUser = loopbackContext.get('currentUser');

		inject = function(ctx, user, next) {
			debug("user:", user);
			ctx.instance.ownerId = user.id;
			debug("ctx.instance: ", ctx.instance);
			next();
		}

		if (currentUser == null) {

			const user = loopback.getModel('user');
			user.find({where: {email: "dominik@dobots.nl"}}, function(err, res) {
				if (err) {
					debug("fatal error");
				} else {
					currentUser = res[0];
					inject(ctx, currentUser, next);
				}
			})
		} else {
			inject(ctx, currentUser, next)
		}

	};

	model.observe('before save', injectOwner);
	// model.beforeRemote('create', injectOwner);
	// model.beforeRemote('upsert', injectOwner);

	var updateOwnerAccess = function(ctx, next) {
		debug("instance: ", ctx.instance);

		// const GroupAccess = loopback.getModel('GroupAccess');
		// GroupAccess.create({
		// 	groupId: instance.id,
		// 	userId: instance.ownerId,
		// 	role: "$group:owner"
		// }, function(err, res) {
		// 	if (err) {
		// 		debug("Error: ", err);
		// 	} else {
		// 		debug("OK");
		// 	}
		// });

		addGroupAccess(ctx.instance.ownerId, ctx.instance.id, "$group:owner",
			function(err, res) {

			});

		next();
	};

	// model.afterRemote('create', updateOwnerAccess);
	model.observe('after save', updateOwnerAccess);

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
		addUser(email, id, "$group:guest", cb);
	};

	model.remoteMethod(
		'addGuest',
		{
			http: {path: '/:id/guests', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', http: { source : 'query' }, required: true},
				{arg: 'id', type: 'any', required: true}
			],
			description: "Add an existing user as a member to this group"
		}
	);

	model.addMember = function(email, id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		addUser(email, id, "$group:member", cb);
	};

	model.remoteMethod(
		'addMember',
		{
			http: {path: '/:id/members', verb: 'put'},
			accepts: [
				{arg: 'email', type: 'string', http: { source : 'query' }, required: true},
				{arg: 'id', type: 'any', required: true}
			],
			description: "Add an existing user as a guest to this group"
		}
	);

	var createUser = function(email, password, id, access, cb) {
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
					user.create({email: email, password: password}, function(err, instance) {
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

	model.createNewGuest = function(email, id, password, cb) {
		// debug("email:", email);
		// debug("id:", id);
		createUser(email, id, password, "$group:guest", cb);
	};

	model.remoteMethod(
		'createNewGuest',
		{
			http: {path: '/:id/guests', verb: 'post'},
			accepts: [
				{arg: 'email', type: 'string', http: { source : 'query' }, required: true},
				{arg: 'password', type: 'string', http: { source : 'query' }, required: true},
				{arg: 'id', type: 'any', required: true}
			],
			description: "Create a new user and make it a guest of this group"
		}
	);

	model.createNewMember = function(email, id, password, cb) {
		// debug("email:", email);
		// debug("id:", id);
		createUser(email, id, password, "$group:member", cb);
	};

	model.remoteMethod(
		'createNewMember',
		{
			http: {path: '/:id/members', verb: 'post'},
			accepts: [
				{arg: 'email', type: 'string', http: { source : 'query' }, required: true},
				{arg: 'password', type: 'string', http: { source : 'query' }, required: true},
				{arg: 'id', type: 'any', required: true}
			],
			description: "Create a new user and make it a member of this group"
		}
	);

	var findUsersWithRole = function(id, access, cb) {

		model.findById(id, function(err, instance) {
			if (err) return cb(err);

			// instance.users({where: {role: "$group:member"}}, cb);
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
		findUsersWithRole(id, '$group:member', cb);
	};

	model.remoteMethod(
		'members',
		{
			http: {path: '/:id/members', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true}
			],
			returns: {arg: 'members', type: 'user'},
			description: "Queries members of Group"
		}
	);

	model.guests = function(id, cb) {
		// debug("email:", email);
		// debug("id:", id);
		findUsersWithRole(id, '$group:guest', cb);
	};

	model.remoteMethod(
		'guests',
		{
			http: {path: '/:id/guests', verb: 'get'},
			accepts: [
				{arg: 'id', type: 'any', required: true}
			],
			returns: {arg: 'guests', type: 'user'},
			description: "Queries guests of Group"
		}
	);


};
