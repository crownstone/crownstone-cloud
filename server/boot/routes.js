module.exports = function(app) {
  // Install a "/ping" route that returns "pong"
  app.get('/ping', function(req, res) {
    res.send('pong');
  });

  app.greet = function(msg, cb) {
  	console.log(text);
  	cb(null, "Greetings ... " + msg);
  }

  var router = app.loopback.Router();
  router.get('/greet', function(req, res) {
  	res.json({ response: 'greetings'});
  })
  app.use(router);

};
