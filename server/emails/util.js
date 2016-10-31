var loopback = require('loopback');
var path = require('path');
const debug = require('debug')('loopback:dobots');

var util = {

	sendStoneRecoveredEmail : function(user, stone) {

		const Email = loopback.findModel('Email');

		var app = require('../../server/server');
		var currentUser = app.accessUtils.getCurrentUser();
		var html = 'The stone with uid <b>' + stone.uid + '</b>, ' +
				   'major <b>' + stone.major + '</b> ' +
				   'and minor <b>' + stone.minor + '</b> was recovered and ' +
				   'added to a new group'
		Email.send({
			to: user.email,
			from: 'noreply@crownstone.rocks',
			subject: 'Notification email',
			html: html
		}, function(err) {
			if (err) return debug('failed to send stone recovery notification email');
			debug('sending stone recovery notification email to:', user.email);
		});
	},

	sendRemovedFromSphereEmail : function(user, sphere, next) {

		const Email = loopback.findModel('Email');

		var app = require('../../server/server');
		var currentUser = app.accessUtils.getCurrentUser();
		var html = 'You were removed from the sphere <b>' + sphere.name + '</b> by ' +
					currentUser.firstName + ' ' + currentUser.lastName;
		Email.send({
			to: user.email,
			from: 'noreply@crownstone.rocks',
			subject: 'Notification email',
			html: html
		}, function(err) {
			if (err) return debug('failed to send notification email');
			debug('sending remove notification email to:', user.email);
		});
	},

	sendResetPasswordRequest : function(url, token, email) {

		const Email = loopback.findModel('Email');

		var html = 'Click <a href="' + url + '?access_token=' +
				token + '">here</a> to reset your password';

		Email.send({
			to: email,
			from: 'noreply@crownstone.rocks',
			subject: 'Password reset',
			html: html
		}, function(err) {
			if (err) return debug('error sending password reset email');
			debug('sending password reset email to:', email);
		});
	},

	getVerificationEmailOptions: function(user) {
		// see node_modules/loopback/common/models/user.js for options overview
		// and docs at https://docs.strongloop.com/display/public/LB/Registering+users
		var options = {
			type: 'email',
			to: user.email,
			from: 'noreply@crownstone.rocks',
			subject: 'Thanks for registering.',
			template: path.resolve(__dirname, '../../server/emails/verify.ejs'),
			redirect: '/verified',
			user: user,
			protocol: 'http',
			port: 80
		};

		return options;
	},

	sendNewUserInviteEmail: function(sphere, email, acceptUrl, declineUrl, token) {

		const Email = loopback.findModel('Email');

		var html = 'You have been invited to the sphere <b>' + sphere.name + '</b>. ' +
				'You can use the following link to follow up on the registration:<br>' +
				acceptUrl + '?access_token=' + token + '&sphere_id=' + sphere.id + '<br>' +
				'Or click here to decline:<br>' + 
				declineUrl + '?access_token=' + token + '&sphere_id=' + sphere.id;

		Email.send({
			to: email,
			from: 'noreply@crownstone.rocks',
			subject: 'Invitation to sphere ' + sphere.name,
			html: html
		}, function(err) {
			if (err) return debug('error sending invitation email');
			debug('sending invitation email to:', email);
		});

	},

	// sendAddedToSphereEmail : function(user, sphere, next) {

	// 	const Email = loopback.findModel('Email');

	// 	var app = require('../../server/server');
	// 	var currentUser = app.accessUtils.getCurrentUser();
	// 	var html = 'You were added to the sphere <b>' + sphere.name + '</b> by ' +
	// 				currentUser.firstName + ' ' + currentUser.lastName;
	// 	Email.send({
	// 		to: user.email,
	// 		from: 'noreply@crownstone.rocks',
	// 		subject: 'Notification email',
	// 		html: html
	// 	}, function(err) {
	// 		if (err) return debug('failed to send notification email');
	// 		debug('sending add notification email to:', user.email);
	// 	});
	// },

	sendExistingUserInviteEmail: function(user, sphere, acceptUrl, declineUrl) {

		const Email = loopback.findModel('Email');

		var app = require('../../server/server');
		var currentUser = app.accessUtils.getCurrentUser();

		var html = 'You have been invited to the sphere <b>' + sphere.name + '</b> by ' +
					currentUser.firstName + ' ' + currentUser.lastName + '. ' +
					'To complete the process, please click the following link to accept:<br>' +
					acceptUrl + '?sphere_id=' + sphere.id + '<br>' +
					'Or click here to decline:<br>' + 
					declineUrl + '?sphere_id=' + sphere.id;

		Email.send({
			to: user.email,
			from: 'noreply@crownstone.rocks',
			subject: 'Invitation to sphere ' + sphere.name,
			html: html
		}, function(err) {
			if (err) return debug('error sending invitation email');
			debug('sending invitation email to:', user.email);
		});

	}
}

module.exports = util;
