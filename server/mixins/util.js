module.exports = function(model, options) {

  model.checkForNullError = function(result, cb, query) {
    if (!result) {
    	var msg;
    	if (query) {
	    	msg = 'Unknown "' + model.modelName + '" ' + query + '.';
	    } else {
	    	msg = 'Unknown "' + model.modelName + '".';
	    }
	    var error = new Error(msg);
	    error.statusCode = error.status = 404;
	    error.code = 'MODEL_NOT_FOUND';
	    cb(error);

	    return true;
	} else {
		return false;
	}
  }

}

