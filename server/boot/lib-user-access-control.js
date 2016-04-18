module.exports = function(app) {
  var Role = app.models.Role;
  Role.registerResolver('lib-user', function(role, context, cb) {
    console.log("resolve lib user");
    function reject() {
      process.nextTick(function() {
        cb(null, false);
      });
    }
    // if (context.modelName !== 'Device') {
    //   // the target model is not project
    //   return reject();
    // }
    var userId = context.accessToken.userId;
    if (!userId) {
      return reject(); // do not allow anonymous users
    }

    app.models.user.findById(userId, function(err, user) {
      if (err) {
        reject(err);
      } else {
        cb(null, user.role === 'lib-user');
      }
    });
  });
};
