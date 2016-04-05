var config = require('../../server/config.json');
var path = require('path');
var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(user) {

  user.disableRemoteMethod('find', true);
  user.disableRemoteMethod('findOne', true);
  user.disableRemoteMethod('updateAll', true);
  user.disableRemoteMethod('upsert', true);
  user.disableRemoteMethod('exists', true);
  user.disableRemoteMethod('createChangeStream', true);

  user.disableRemoteMethod('__get__accessTokens', false);
  user.disableRemoteMethod('__create__accessTokens', false);
  user.disableRemoteMethod('__delete__accessTokens', false);
  user.disableRemoteMethod('__count__accessTokens', false);
  user.disableRemoteMethod('__findById__accessTokens', false);
  user.disableRemoteMethod('__destroyById__accessTokens', false);
  user.disableRemoteMethod('__updateById__accessTokens', false);

  user.disableRemoteMethod('__create__currentLocation', false);
  user.disableRemoteMethod('__delete__currentLocation', false);
  user.disableRemoteMethod('__updateById__currentLocation', false);
  user.disableRemoteMethod('__deleteById__currentLocation', false);

  user.disableRemoteMethod('__delete__groups', false);
  user.disableRemoteMethod('__create__groups', false);
  user.disableRemoteMethod('__updateById__groups', false);
  user.disableRemoteMethod('__destroyById__groups', false);

  user.sendVerification = function(user, cb) {

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

    user.verify(options, cb);
  };

  //send verification email after registration
  user.afterRemote('create', function(context, user, next) {
    console.log('> user.afterRemote triggered');

    user.sendVerification(user, function(err, response, next) {
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
  });

  //send password reset link when requested
  user.on('resetPasswordRequest', function(info) {
    var url = (process.env.BASE_URL || ('http://' + config.host + ':' + config.port)) + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';

    user.app.models.Email.send({
      to: info.email,
      from: info.email,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });

  user.me = function(cb) {
    const loopbackContext = loopback.getCurrentContext();
    var currentUser = loopbackContext.get('currentUser');

    if (currentUser) {
      cb(null, currentUser);
    } else {
      cb({message: "WTF: user not found??"});
    }
  }

  user.remoteMethod(
    'me',
    {
      http: {path: '/me', verb: 'get'},
      returns: {arg: 'user', type: 'object'}
    }
  );

  user.createNewGroup = function(data, id, cb) {
    debug("createNewGroup:", data);
    const Group = loopback.getModel('Group');
    Group.create(data, cb);
  }

  user.remoteMethod(
    'createNewGroup',
    {
      http: {path: '/:id/groups', verb: 'post'},
      accepts: [
        {arg: 'data', type: 'object', required: true},
        {arg: 'id', type: 'any', required: true}
      ],
      returns: {type: 'object'},
      description: "Creates a new instance in groups of this model"
    }
  );

};
