var loopback = require('loopback');
var path = require('path');
const debug = require('debug')('loopback:dobots');

var util = {

	sendRemovedFromGroupEmail : function(user, group, next) {

		const Email = loopback.findModel('Email');

		var app = require('../../server/server');
		var currentUser = app.accessUtils.getCurrentUser();
		var html = 'You were removed from the group <b>' + group.name + '</b> by ' +
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

	sendAddedToGroupEmail : function(user, group, next) {

		const Email = loopback.findModel('Email');

		var app = require('../../server/server');
		var currentUser = app.accessUtils.getCurrentUser();
		var html = 'You were added to the group <b>' + group.name + '</b> by ' +
					currentUser.firstName + ' ' + currentUser.lastName;
		Email.send({
			to: user.email,
			from: 'noreply@crownstone.rocks',
			subject: 'Notification email',
			html: html
		}, function(err) {
			if (err) return debug('failed to send notification email');
			debug('sending add notification email to:', user.email);
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
	}
}

module.exports = util;
