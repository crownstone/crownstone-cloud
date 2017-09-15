// "use strict";

let loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

  model.observe('before save', function(ctx, next) {
    const Message = loopback.getModel('Message');
    Message.findById(ctx.instance.messageId, function(err, message) {
      if (err) next(err);
      ctx.instance.sphereId = message.sphereId;
      next();
    });
  });
};