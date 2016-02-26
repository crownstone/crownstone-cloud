var updateDS = require('./updateDS.js');

module.exports = function() {

	return function udpate(req, res, next) {
		if (!req.accessToken) {
			return next();
			// return updateDS.update(undefined, req.app, next);
		}
		req.app.models.user.findById(req.accessToken.userId, function(err, user) {
			if (err) {
				return next(err);
			}
			// if (!user) {
			//   return next(new Error('No user with this access token was found.'));
			// }
			return updateDS.update(user, req.app, next);
		});
	}

}
