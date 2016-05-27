var config = require('../../server/config.json');
var path = require('path');
var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

var util = require('../../server/emails/util');

module.exports = function(model) {

	///// put the acls by default, since the base model user
	///// already has the ACLs set anyway
	// var app = require('../../server/server');
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
	model.disableRemoteMethod('__count__currentLocation', false);

	model.disableRemoteMethod('__delete__groups', false);
	model.disableRemoteMethod('__create__groups', false);
	model.disableRemoteMethod('__updateById__groups', false);
	model.disableRemoteMethod('__destroyById__groups', false);
	model.disableRemoteMethod('__link__groups', false);

	/************************************
	 **** Model Validation
	 ************************************/

	// reserved user roles for special liberties
	model.validatesExclusionOf('role', {in: ['superuser', 'admin', 'lib-user'], allowNull: true});

	const regex = /^(?=.*\d).{8,}$/; // Password must be at least 8 characters long and include at least one numeric digit.
	// const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).{8,}$/; // Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, one numeric digit, and no spaces.
	// const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)(?=.*[!@#$%^&amp;*()_+}{&quot;:;'?/&gt;.&lt;,]).{8,}$/; // Password must be at least 8 characters, and must include at least one upper case letter, one lower case letter, one numeric digit, no spaces, and one special character
	model.validatesFormatOf('password', {with: regex, message: 'Invalid format. Password needs to be at least 8 characters long and include at least 1 digit'})

	/************************************
	 **** Verification checks
	 ************************************/

	// check that the owner of a group can't unlink himself from the group, otherwise there will
	// be access problems to the group. And a group should never be without an owner.
	model.beforeRemote('*.__unlink__groups', function(context, user, next) {

		const Group = loopback.findModel('Group');
		Group.findById(context.args.fk, function(err, group) {
			if (err) return next(err);
			if (!group) return next();

			if (new String(group.ownerId).valueOf() === new String(context.instance.id).valueOf()) {
				error = new Error("can't exit from group where user with id is the owner");
				return next(error);
			} else {
				next();
			}
		})
	});

	// check that a user is not deleted as long as he is owner of a group
	model.observe('before delete', function(context, next) {

		const Group = loopback.findModel('Group');
		Group.find({where:{ownerId: context.where.id}}, function(err, groups) {
			if (err) return next(err);
			if (groups.length > 0) {
				error = new Error("Can't delete user as long as he is owner of a group");
				next(error);
			} else {
				next();
			}
		});
	});

	/************************************
	 **** Custom functions
	 ************************************/

	model.sendVerification = function(user, func, cb) {

		var options = util.getVerificationEmailOptions(user);
		options.generateVerificationToken = func;
		// var options = {
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

		user.verify(options, cb);
	};

	//send verification email after registration
	model.afterRemote('create', function(context, user, next) {
		console.log('> user.afterRemote triggered');

		if (model.settings.emailVerificationRequired) {
			model.sendVerification(user, null, function(err, response) {
				if (err) return next(err);

				console.log('> verification email sent:', response);
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
			next();
		}
		// next();
	});

	//send password reset link when requested
	model.on('resetPasswordRequest', function(info) {
		var url = (process.env.BASE_URL || ('http://' + config.host + ':' + config.port)) + '/reset-password'
		var token = info.accessToken.id;
		var email = info.email;
		util.sendResetPasswordRequest(url, token, email);
	});

	model.resendVerification = function(email, cb) {
		model.findOne({where: {email: email}}, function(err, user) {
			if (!user.emailVerified) {
				model.sendVerification(user,
					function(user, cb) {
						cb(null, user.verificationToken);
					},
					function(err, response) {
						cb();
					}
				);
			} else {
				var err = new Error("user already verified");
				err.statusCode = 400;
				err.code = 'ALREADY_VERIFIED';
				cb(err);
			}
		})
	}

	model.remoteMethod(
		'resendVerification',
		{
			http: {path: '/resendVerification', verb: 'post'},
			accepts: {arg: 'email', type: 'string', required: true, 'http': {source: 'query'}},
			description: "Resend verification email"
		}
	);

	model.me = function(cb) {
		const loopbackContext = loopback.getCurrentContext();
		var currentUser = loopbackContext.get('currentUser');

		if (currentUser) {
			cb(null, currentUser);
		} else {
			cb({message: "WTF: user not found??"});
		}
	}

	model.remoteMethod(
		'me',
		{
			http: {path: '/me', verb: 'get'},
			returns: {arg: 'data', type: 'user', root: true},
			description: "Return instance of authenticated User"
		}
	);

	model.createNewGroup = function(data, id, cb) {
		debug("createNewGroup:", data);
		const Group = loopback.getModel('Group');
		Group.create(data, cb);
	}

	// var app = require('../../server/server');
	// var Group = app.models.Group;

	model.remoteMethod(
		'createNewGroup',
		{
			http: {path: '/:id/groups', verb: 'post'},
			accepts: [
				{arg: 'data', type: 'Group', 'http': {source: 'body'}},
				{arg: 'id', type: 'any', required: true, 'http': {source: 'path'}}
			],
			returns: {arg: 'data', type: 'Group', root: true},
			description: "Creates a new instance in groups of this model"
		}
	);

	/************************************
	 **** Container Methods
	 ************************************/

	model.listFiles = function(id, cb) {
		const Container = loopback.getModel('UserContainer');
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
			description: "Queries files of User"
		}
	);

	model.countFiles = function(id, cb) {
		const Container = loopback.getModel('UserContainer');
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
		const Container = loopback.getModel('UserContainer');
		Container._deleteContainer(id, cb);
	}

	model.remoteMethod(
		'deleteAllFiles',
		{
			http: {path: '/:id/files', verb: 'delete'},
			accepts: [
				{arg: 'id', type: 'any', required: true, http: { source : 'path' }}
			],
			description: "Delete all files of User"
		}
	);

	model.downloadFile = function(id, fk, res, cb) {
		const Container = loopback.getModel('UserContainer');
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
		const Container = loopback.getModel('UserContainer');
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
			description: "Upload a file to User"
		}
	);

	model.uploadProfilePic = function(id, req, cb) {
		// debug("uploadProfilePic");

		var upload = function(user, req) {

			// upload the file
			model.uploadFile(user.id, req, function(err, file) {
				if (err) return cb(err);

				// and set the id as profilePicId
				user.profilePicId = file._id;
				user.save();

				cb(null, file);
			});
		}

		// get the user instance
		model.findById(id, function(err, user) {
			if (err) return cb(err);

			// if there is already a profile picture uploaded, delete the old one first
			if (user.profilePicId) {
				model.deleteFile(user.id, user.profilePicId, function(err, file) {
					if (err) return cb(err);
					upload(user, req);
				});
			} else {
				upload(user, req);
			}

		});
	}

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

			model.downloadFile(id, user.profilePicId, res, cb);
		});
	}

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

	/************************************
	 **** Keys Methods
	 ************************************/

	model.getEncryptionKeys = function(id, cb) {
		const GroupAccess = loopback.getModel('GroupAccess');
		GroupAccess.find({where: {userId: id}, include: "group"}, function(err, objects) {
			keys = Array.from(objects, function(access) {
				el = { groupId: access.groupId, keys: {}};
				switch (access.role) {
					case "owner": {
						el.keys.owner = access.group().ownerEncryptionKey;
					}
					case "member": {
						el.keys.member = access.group().memberEncryptionKey;
					}
					case "guest": {
						el.keys.guest = access.group().guestEncryptionKey;
					}
				}
				return el
			});
			cb(null, keys);
		});
	}

	model.remoteMethod(
		'getEncryptionKeys',
		{
			http: {path: '/:id/keys', verb: 'get'},
			accepts: {arg: 'id', type: 'any', required: true, http: { source : 'path' }},
			returns: {arg: 'data', type: ['object'], root: true},
			description: "Download profile pic of User"
		}
	);

};
