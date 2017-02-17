var loopback = require('loopback');
var path = require('path');
const debug = require('debug')('loopback:dobots');
const Email = loopback.findModel('Email');
var app = require('../../server/server');

var util = {

	sendStoneRecoveredEmail : function(user, stone) {
		var currentUser = app.accessUtils.getCurrentUser();
		Email.send({
			to: user.email,
			from: 'noreply@crownstone.rocks',
			fromname: 'Crownstone',
			subject: 'Notification email',
      template: path.resolve(__dirname, './stoneRecoveredEmail.ejs'),
      uid: stone.uid,
      major: stone.major,
      minor: stone.minor,
		}, function(err) {
			if (err) return debug('failed to send stone recovery notification email');
			debug('sending stone recovery notification email to:', user.email);
		});
	},

	sendRemovedFromSphereEmail : function(user, sphere, next) {
		var currentUser = app.accessUtils.getCurrentUser();
		var html = 'You were removed from the sphere <b>' + sphere.name + '</b> by ' +
					currentUser.firstName + ' ' + currentUser.lastName;
		Email.send({
			to: user.email,
			from: 'noreply@crownstone.rocks',
			fromname: 'Crownstone',
			from_name: 'Crownstone',
			subject: 'Notification email',
			html: html
		}, function(err) {
			if (err) return debug('failed to send notification email');
			debug('sending remove notification email to:', user.email);
		});
	},

	sendResetPasswordRequest : function(url, token, email) {
		var html = 'Click <a href="' + url + '?access_token=' +
				token + '">here</a> to reset your password';

		Email.send({
			to: email,
			from: 'noreply@crownstone.rocks',
			fromname: 'Crownstone',
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
			fromname: 'Crownstone',
			subject: 'Thanks for registering.',
			template: path.resolve(__dirname, './verificationEmail.ejs'),
			redirect: '/verified',
			user: user,
			protocol: 'https',
			port: 443
		};

		return options;
	},

	sendNewUserInviteEmail: function(sphere, email, acceptUrl, declineUrl, token) {
		var html = 'You have been invited to the sphere <b>' + sphere.name + '</b>. ' +
				'You can use the following link to follow up on the registration:<br>' +
				acceptUrl + '?access_token=' + token + '&sphere_id=' + sphere.id + '<br>' +
				'Or click here to decline:<br>' +
				declineUrl + '?access_token=' + token + '&sphere_id=' + sphere.id;

		Email.send({
			to: email,
			from: 'noreply@crownstone.rocks',
			fromname: 'Crownstone',
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
			fromname: 'Crownstone',
			subject: 'Invitation to sphere ' + sphere.name,
			html: html
		}, function(err) {
			if (err) return debug('error sending invitation email');
			debug('sending invitation email to:', user.email);
		});

	}
};

module.exports = util;
