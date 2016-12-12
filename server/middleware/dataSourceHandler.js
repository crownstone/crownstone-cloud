var updateDS = require('./updateDS.js');

module.exports = function() {

	return function update(req, res, next) {
		// console.log(req.accessToken)
		// if (!req.accessToken) {
		// 	// return next();
		// }
		return updateDS.update(req.accessToken, req.app, next);
	}

}
