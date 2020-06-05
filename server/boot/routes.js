let sha1 = require('sha1');
let request = require('request');
let bodyParser = require('body-parser');
const notificationHandler = require("../modules/NotificationHandler");
const EventHandler = require("../modules/EventHandler");
const SSEManager = require("../modules/SSEManager");
const debug = require('debug')('loopback:dobots');

module.exports = function (app) {
  let User = app.models.user;
  let Sphere = app.models.Sphere;
  let SphereAccess = app.models.SphereAccess;

  function hashPassword(password) {
    return sha1(password);
  }

  //login page
  app.get('/', function (req, res) {
    res.render('main', {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
  });

  //login page
  app.get('/apple-app-site-association', function (req, res) {
    let payload = {
      applinks: {
        apps: [],
        details: []
      }
    };
    payload.applinks.details.push({appID:"6LYJ9PNC3V.com.crownstone.Crownstone",paths:['callbackURL']});
    res.set("Content-Type","application/pkcs7-mime");
    res.send(JSON.stringify(payload, undefined, 2));
  });

  //callback page
  app.use( bodyParser.json() );
  app.post('/test', function (req, res) {
    res.send(req.body);
  });


  //callback page
  app.get('/callback', function (req, res) {
    res.render('callback');
  });


  //callbackURL page
  app.get('/callbackURL', function (req, res) {
    let codeExtractRegex = /code=(.*?)&/gm;
    let result = codeExtractRegex.exec(req.originalUrl);

    if (!result || result.length != 2) { return this.setState({failed: true}); }

    let code = result[1];
    res.render('callbackURL', { code : code });
    // res.send('<a href="https://my.crownstone.rocks' + req.originalUrl + '">clickMe</a>');
  });

  //verified
  app.get('/verified', function (req, res) {
    res.render('verified', {});
  });

  //about
  app.get('/about', function (req, res) {
    res.render('about', {});
  });

  app.get('/login', function (req, res) {
    res.render('login', {
      title: 'Please log in',
      redirectTo: '/',
      loginPostUrl: '/login',
    });
  });

  app.get('/loginOauth', function (req, res) {
    res.render('login', {
      title: 'Please log in (Oauth2)',
      redirectTo: '/loginOauth',
      loginPostUrl: '/loginOauth',
    });
  });


  //log a user in
  app.post('/loginOauth', function (req, res) {
    if (!req.body.email || !req.body.password) {
      res.render('response', {
        title: 'Login failed',
        content: 'Email and/or password not provided',
        redirectTo: '/loginOauth',
        redirectToLinkText: 'Email and/or password not provided',
      });
      return;
    }

    let baseUrl = app.get('url').replace(/\/$/, '');
    if (process.env.BASE_URL) {
      baseUrl = 'https://' + process.env.BASE_URL;
    }

    req.body = {username: req.body.email, password: hashPassword(req.body.password)};
    req.url = baseUrl + '/loginOauthStep2';

    debug('"url": req.url', req.url);

    // forward the request handling to the next endPoint;
    app.handle(req, res);
  });

  app.post('/login', function (req, res) {
    if (!req.body.email || !req.body.password) {
      res.render('response', {
        title: 'Login failed',
        content: 'err',
        redirectTo: '/',
        redirectToLinkText: 'Email and/or password not provided',
      });
      return;
    }

    User.login({
      email: req.body.email,
      password: hashPassword(req.body.password)
    }, 'user', function (err, token) {
      if (err) {
        if (err.code === 'LOGIN_FAILED_EMAIL_NOT_VERIFIED') {
          res.render('response', {
            title: 'Login failed',
            content: err,
            redirectTo: '/resend-verification',
            redirectToLinkText: 'Resend verification',
          });
        } else {
          res.render('response', {
            title: 'Login failed',
            content: err,
            redirectTo: '/',
            redirectToLinkText: 'Try again',
          });
        }
        return;
      }

      res.render('home', {
        email: req.body.email,
        accessToken: token.id,
      });
    });
  });

  //log a user out
  app.get('/logout', function (req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);
    User.logout(req.accessToken.id, function (err) {
      if (err) return next(err);
      res.redirect('/');
    });
  });

  app.get('/resend-verification', function (req, res) {
    res.render('resend-verification', {email: ''});
  });

  app.post('/request-verification', function (req, res, next) {
    User.resendVerification(req.body.email, function (err, user) {
      if (err) return next(err);

      res.render('response', {
        title: 'Verification email successfully resent',
        content: 'Please check your email and click on the verification link ' +
        'before logging in.',
        redirectTo: '/',
        redirectToLinkText: 'Log in',
      });
    });
  });

  //send an email with instructions to reset an existing user's password
  app.post('/request-password-reset', function (req, res, next) {
    User.resetPassword({
      email: req.body.email
    }, function (err) {
      if (err) return res.status(401).send(err);

      res.render('responseWithoutRedirect', {
        title: 'Password reset requested',
        content: 'Check your email for further instructions.',
      });
    });
  });

  //show password reset form
  app.get('/reset-password', function (req, res, next) {
    if (!req.accessToken) {
      return res.render('response', {
        title: 'Bad Request',
        content: 'Access Token is expired, please try again',
        redirectTo: '/',
        redirectToLinkText: 'Try again',
      });
    }

    res.render('password-reset', {
      accessToken: req.accessToken.id,
    });
  });

  //reset the user's pasword
  app.post('/reset-password', function (req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);

    //verify passwords match
    if (!req.body.password ||
      !req.body.confirmation ||
      req.body.password !== req.body.confirmation) {
      return res.sendStatus(400, new Error('Passwords do not match'));
    }

    User.findById(req.accessToken.userId, function (err, user) {
      if (err) return res.sendStatus(404);
      user.updateAttribute('password', hashPassword(req.body.password), function (err, user) {
        // user.updateAttribute('password', req.body.password, function(err, user) {
        if (err) return res.sendStatus(404);
        res.render('responseWithoutRedirect', {
          title: 'Password reset success',
          content: 'Your password has been reset successfully. You can now use this password to log into the app and cloud services.',
        });
      });
    });
  });

  app.get('/decline-invite-new', function (req, res, next) {
    if (!req.accessToken) {
      return res.render('response', {
        title: 'Bad Request',
        content: 'Invitation is expired, ask an admin of the sphere to resend the invitation',
        redirectTo: '/',
        redirectToLinkText: 'Back',
      });
    }

    User.findById(req.accessToken.userId, function (err, user) {
      if (user.emailVerified) {
        // return res.sendStatus(400, new Error("User already verified"));

        res.render('response', {
          title: 'Bad Request',
          content: 'User is already verified',
          redirectTo: '/',
          redirectToLinkText: 'Log in',
        });
      } else {
        SphereAccess.destroyAll({sphereId: req.query.sphere_id, userId: user.id}, function (err) {
          if (err) console.log("failed to remove user from sphere");
          user.destroy(function (err, info) {
            if (err) console.log("failed to delete user");
            // tell other people in the sphere to refresh their sphere user list.
            notificationHandler.notifySphereUsers(req.query.sphere_id, {data: { sphereId: req.query.sphere_id, command:"sphereUsersUpdated" }, silent: true });

            res.render('response', {
              title: 'Invite declined',
              content: 'You have declined the invitation',
              redirectTo: '/',
              redirectToLinkText: 'Log in',
            });
          });
        })
      }
    });
  });

  app.get('/accept-invite', function (req, res, next) {
    res.render('login', {
      email: "",
      password: "",
      loginPostUrl: "/accept-invite?sphere_id=" + req.query.sphere_id,
    });
  });

  //log a user in
  app.post('/accept-invite', function (req, res) {
    User.login({
      email: req.body.email,
      password: hashPassword(req.body.password)
    }, 'user', function (err, token) {
      if (err) {
        if (err.code === 'LOGIN_FAILED_EMAIL_NOT_VERIFIED') {
          res.render('response', {
            title: 'Login failed',
            content: err,
            redirectTo: '/resend-verification',
            redirectToLinkText: 'Resend verification',
          });
        } else {
          res.render('response', {
            title: 'Login failed',
            content: err,
            redirectTo: '/',
            redirectToLinkText: 'Try again',
          });
        }
        return;
      }

      SphereAccess.updateAll(
        {sphereId: req.query.sphere_id, userId: token.userId, invitePending: true},
        {invitePending: false},
        function (err, info) {
          if (err) console.log("failed to update sphere access");

          if (info.count == 0) {
            res.render('response', {
              title: 'Bad Request',
              content: 'No pending invitation found',
              redirectTo: '/',
              redirectToLinkText: 'Log in',
            });
          }
          else {
            EventHandler.dataChange.sendSphereUserCreatedEventById(req.query.sphere_id, token.userId);

            // tell other people in the sphere to refresh their sphere user list.
            notificationHandler.notifySphereUsers(req.query.sphere_id, {data: { sphereId: req.query.sphere_id, command:"sphereUsersUpdated" }, silent: true });
            res.render('response', {
              title: 'Invite accepted',
              content: 'You have accepted the invitation',
              redirectTo: '/',
              redirectToLinkText: 'Log in',
            });
          }
        });

    });
  });


  app.get('/decline-invite', function (req, res, next) {
    res.render('login', {
      email: "",
      password: "",
      loginPostUrl: "/decline-invite?sphere_id=" + req.query.sphere_id,
    });
  });

  //log a user in
  app.post('/decline-invite', function (req, res) {
    User.login({
      email: req.body.email,
      password: hashPassword(req.body.password)
    }, 'user', function (err, token) {
      if (err) {
        if (err.code === 'LOGIN_FAILED_EMAIL_NOT_VERIFIED') {
          res.render('response', {
            title: 'Login failed',
            content: err,
            redirectTo: '/resend-verification',
            redirectToLinkText: 'Resend verification',
          });
        } else {
          res.render('response', {
            title: 'Login failed',
            content: err,
            redirectTo: '/',
            redirectToLinkText: 'Try again',
          });
        }
        return;
      }

      SphereAccess.destroyAll(
        {sphereId: req.query.sphere_id, userId: token.userId, invitePending: true},
        function (err, info) {
          if (err) console.log("failed to remove user from sphere");

          if (info.count == 0) {
            res.render('response', {
              title: 'Bad Request',
              content: 'No pending invitation found',
              redirectTo: '/',
              redirectToLinkText: 'Log in',
            });
          }
          else {
            // tell other people in the sphere to refresh their sphere user list.
            notificationHandler.notifySphereUsers(req.query.sphere_id, {data: { sphereId: req.query.sphere_id, command:"sphereUsersUpdated" }, silent: true });
            res.render('response', {
              title: 'Invite declined',
              content: 'You have declined the invitation',
              redirectTo: '/',
              redirectToLinkText: 'Log in',
            });
          }
        })
    });
  });

  //show profile setup form
  app.get('/profile-setup', function (req, res, next) {
    if (!req.accessToken) {
      return res.render('response', {
        title: 'Bad Request',
        content: 'Invitation is expired, ask an admin of the sphere to resend the invitation',
        redirectTo: '/',
        redirectToLinkText: 'Back',
      });
    }

    User.findById(req.accessToken.userId, function (err, user) {
      if (user.emailVerified) {
        res.render('response', {
          title: 'Bad Request',
          content: 'User is already successfully set up',
          redirectTo: '/',
          redirectToLinkText: 'Log in',
        });
        // return res.sendStatus(400, new Error("User is already successfully set up"));
      } else {
        res.render('profile-setup', {
          accessToken: req.accessToken.id,
          sphereId: req.query.sphere_id,
        });
      }
    });
  });

  //reset the user's pasword
  app.post('/profile-setup', function (req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);

    //verify passwords match
    if (!req.body.firstName || !req.body.lastName) {
      return res.render('response', {
        title: 'Failure',
        content: 'First and last name have to be filled in!',
        redirectTo: '/',
        redirectToLinkText: 'Back',
      });
    }
    if (!req.body.password ||
      !req.body.confirmation ||
      req.body.password !== req.body.confirmation) {
      return res.render('response', {
        title: 'Failure',
        content: 'Passwords do not match',
        redirectTo: '/',
        redirectToLinkText: 'Back',
      });
    }

    User.findById(req.accessToken.userId, function (err, user) {
      if (err) return res.sendStatus(404);

      SphereAccess.findOne({where: {and: [{sphereId: req.query.sphere_id}, {userId: req.accessToken.userId}, {invitePending: true}]}},
        function (err, access) {
          if (err || !access) {
            console.log("failed to find user in invites")

            res.render('response', {
              title: 'Bad Request',
              content: 'Failed to find invitation',
              redirectTo: '/',
              redirectToLinkText: 'Back'
            });
          }
          else {

            user.emailVerified = true;
            user.new = false;
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.password = hashPassword(req.body.password);
            user.accountCreationPending = false;
            user.save(function (err, user) {
              if (err) return res.sendStatus(404);

              // tell other people in the sphere to refresh their sphere user list.
              notificationHandler.notifySphereUsers(req.query.sphere_id, {data: { sphereId: req.query.sphere_id, command:"sphereUsersUpdated" }, silent: true });

              access.invitePending = false;
              access.save(function (err, access) {
                if (err) console.log("failed to update sphere access");
              });

              user.accessTokens.destroy(req.accessToken.id, function (err) {
                if (err) console.log("failed to remove temporary access token");
              });

              console.log('> signup successful');
              res.render('response', {
                title: 'Signup success',
                content: 'You successfully completed the signup process',
                redirectTo: '/',
                redirectToLinkText: 'Log in',
              });
            });
          }
        });

    });
  });

  // register a new user
  app.post('/register', function (req, res, next) {

    //verify passwords match
    if (!req.body.firstName || !req.body.lastName) {
      return res.render('response', {
        title: 'Bad Request',
        content: 'First and last name have to be filled in!',
        redirectTo: '/',
        redirectToLinkText: 'Try again',
      });
    }
    if (!req.body.password || !req.body.confirmation || req.body.password !== req.body.confirmation) {
      return res.render('response', {
        title: 'Bad Request',
        content: 'Passwords do not match',
        redirectTo: '/',
        redirectToLinkText: 'Try again',
      });
    }

    console.log("Create user: " + req.body.firstName);
    User.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: hashPassword(req.body.password)
      }).then((user) => {
        return new Promise((resolve, reject) => {
          User.onCreate({res: res}, user, (err) => {
            if (err) {return reject(err)}
            resolve();
          });
        });
      })
      .then((result) => {
        res.render('registrationSuccess', { });
      })
      .catch((err) => {
        return res.render('response', {
          title: 'Bad Request',
          content: "Email already exists",
          redirectTo: '/',
          redirectToLinkText: 'Try again',
        });
      });

  });

  app.get('/debug', function(req, res) {
    let validationToken = process.env.DEBUG_TOKEN || "debug"
    if (req.query.token === validationToken) {
      let debugInformation = {
        amountOfSSEconnections: Object.keys(SSEManager.connections).length,
      };
      res.end(JSON.stringify(debugInformation))
    }
    else {
      res.end("Invalid token.")
    }
  })

};
