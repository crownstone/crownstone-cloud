"use strict";

module.exports = function(model) {

  function addExpiredAt(ctx, next) {
    let item = ctx.instance;
    if (item) {
      if (!item.expiredAt) {
        let createdAt = new Date(item.created);
        item.expiredAt = new Date(createdAt.valueOf() + item.ttl * 1000);
      }
    }
    next(null, item);
  }

  model.observe('before save', addExpiredAt);
};
