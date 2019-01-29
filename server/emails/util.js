let loopback = require('loopback');
let path = require('path');
const debug = require('debug')('loopback:dobots');
const Email = loopback.findModel('Email');
let app = require('../../server/server');

let util = {
  
  /* 
   * See node_modules/loopback/common/models/user.js for options overview
   */
  getDefaultEmailOptions: function(email_to, email_subject) {
    let options = {
      to: email_to,
      type: 'email',
      from: 'ask@crownstone.rocks',
      fromname: 'Crownstone',
      subject: email_subject,
    };
    return options;
  },
  
  /*
   * See https://docs.strongloop.com/display/public/LB/Registering+users for information on registering new users.
   */
  getVerificationEmailOptions: function(user) {
    let template = path.resolve(__dirname, './verificationEmail.html');

    let subject = 'Welcome to Crownstone!';
    let options = this.getDefaultEmailOptions(user.email, subject);
    options.firstName = user.firstName;
    options.lastName = user.lastName;
    options.redirect = '/verified';
    options.user = user;
   
    if (user.firstName === undefined && user.lastName === undefined) {
      options.newUser = 'there';
    } else {
      options.newUser = user.firstName + ' ' + user.lastName;
    }
    options.template = template;

    return options;
  },

  /**
   * Send a email to allow the user to reset a password.
   */
  sendResetPasswordRequest : function(baseUrl, token, email) {
    let resetUrl = baseUrl + '?' + 'access_token=' + token;
    let params = {resetUrl: resetUrl };
    let renderer = loopback.template(path.resolve(__dirname, './passwordResetEmail.html'));
    let html = renderer(params);
    let subject = 'Reset Crownstone password';
    let options = this.getDefaultEmailOptions(email, subject);
    options.html = html;

    Email.send(
      options, 
      function(err) {
        if (err) return debug('error sending password reset email');
        debug('sending password reset email to:', email);
    });
  },

  /*
   * Send an email to a user that is not yet known in the system. This means that only user.email is filled. No
   * information about first or last name is yet available. The currentUser is the user that is inviting the new user.
   * This can be used to make the email more personal with a sentence like "invited by".
   */
  sendNewUserInviteEmail: function(user, currentUser, sphere, acceptUrl, declineUrl, token) {
    let fullAcceptUrl = acceptUrl + '?' + 'access_token=' + token + '&' + 'sphere_id=' + sphere.id;
    let fullDeclineUrl = declineUrl + '?' + 'access_token=' + token + '&' + 'sphere_id=' + sphere.id;
    let invitedByText = '';
    if (currentUser !== null) {
      invitedByText = 'by ' + currentUser.firstName + ' ' + currentUser.lastName + ' ';
    }
    let params = {invitedByText: invitedByText, acceptUrl: fullAcceptUrl, declineUrl: fullDeclineUrl, 
      sphereName: sphere.name };
    let renderer = loopback.template(path.resolve(__dirname, './inviteNewUserEmail.html'));
    let html = renderer(params);
    let subject = 'Welcome! You just have been invited!';
    let options = this.getDefaultEmailOptions(user.email, subject);
    options.html = html;

    Email.send(
      options, 
      function(err) {
        if (err) return debug('error sending invitation email to new user');
        debug('sending invitation email to:', user.email);
    });
  },

  /*
   * Send an email to a user that is already known in the system. The currentUser is the user that is inviting the
   * other user. This can be used to make the email more personal with a sentence like "invited by".
   */
  sendExistingUserInviteEmail: function(user, currentUser, sphere, acceptUrl, declineUrl) {
    let fullAcceptUrl = acceptUrl + '?' + 'sphere_id=' + sphere.id;
    let fullDeclineUrl = declineUrl + '?' + 'sphere_id=' + sphere.id;
    let invitedByText = '';
    if (currentUser !== null) {
      invitedByText = 'by ' + currentUser.firstName + ' ' + currentUser.lastName + ' ';
    }
    let params = {invitedByText: invitedByText, acceptUrl: fullAcceptUrl, declineUrl: fullDeclineUrl, 
      sphereName: sphere.name };
    let renderer = loopback.template(path.resolve(__dirname, './inviteExistingUserEmail.html'));
    let html = renderer(params);
    let subject = 'You just have been invited to sphere ' + sphere.name;
    let options = this.getDefaultEmailOptions(user.email, subject);
    options.html = html;

    Email.send(
      options,
      function(err) {
        if (err) return debug('error sending invitation email to existing user');
        debug('sending invitation email to:', user.email);
      });
  },

  // TODO: actually use this email
  sendStoneRecoveredEmail : function(user, stone) {
    Email.send({
      to: user.email,
      from: 'ask@crownstone.rocks',
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

  // TODO: actually use this email
  sendRemovedFromSphereEmail : function(unlinkedUser, executingUser, sphere) {
    let html = 'You were removed from the Sphere <b>' + sphere.name + '</b>.';
    if (executingUser !== null) {
      html = 'You were removed from the Sphere <b>' + sphere.name + '</b> by ' + executingUser.firstName + ' ' + executingUser.lastName + '.';
    }
    Email.send({
      to: unlinkedUser.email,
      from: 'ask@crownstone.rocks',
      fromname: 'Crownstone',
      subject: 'Notification email',
      html: html
    }, function(err) {
      if (err) return debug('failed to send notification email');
      debug('sending remove notification email to:', unlinkedUser.email);
    });
  }

};

module.exports = util;
