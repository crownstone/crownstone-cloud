var config = require('../../server/config.json');
var path = require('path');
var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	var app = require('../../server/server');
	if (app.get('acl_enabled')) {

		//***************************
		// GENERAL:
		//   - nothing
		//***************************
		model.settings.acls.push({
			"accessType": "*",
			"principalType": "ROLE",
			"principalId": "$everyone",
			"permission": "DENY"
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
	}

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
	 **** Custom functions
	 ************************************/

	model.sendVerification = function(user, cb) {

		var options = {
			type: 'email',
			to: user.email,
			from: 'noreply@crownstone.rocks',
			subject: 'Thanks for registering.',
			template: path.resolve(__dirname, '../../server/views/verify.ejs'),
			redirect: '/verified',
			user: user,
			protocol: 'http',
			port: 80
		};

		console.log("options: " + JSON.stringify(options));

		model.verify(options, cb);
	};

	//send verification email after registration
	model.afterRemote('create', function(context, user, next) {
		console.log('> user.afterRemote triggered');

		if (model.settings.emailVerificationRequired) {
			model.sendVerification(user, function(err, response, next) {
				if (err) return next(err);

				console.log('> verification email sent:', response);

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
	});

	//send password reset link when requested
	model.on('resetPasswordRequest', function(info) {
		var url = (process.env.BASE_URL || ('http://' + config.host + ':' + config.port)) + '/reset-password';
		var html = 'Click <a href="' + url + '?access_token=' +
				info.accessToken.id + '">here</a> to reset your password';

		model.app.models.Email.send({
			to: info.email,
			from: info.email,
			subject: 'Password reset',
			html: html
		}, function(err) {
			if (err) return console.log('> error sending password reset email');
			console.log('> sending password reset email to:', info.email);
		});
	});

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
			returns: {arg: 'data', type: 'user', root: true}
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
			returns: {arg:'data', type:'Group', root:true},
			description: "Creates a new instance in groups of this model"
		}
	);

};
