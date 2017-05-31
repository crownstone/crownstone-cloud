module.exports = function createErrorLogger(options) {
  return function logError(err, req, res, next) {
    // your custom error-logging logic goes here

    const status = err.status || err.statusCode;
    if (status >= 500 || !status) {
      // log only Internal Server errors
      console.log('Unhandled error for request %s %s: %s', req.method, req.url, err.stack || err);
    }

    // Let the next error handler middleware
    // produce the HTTP response
    next(err);
  };
};