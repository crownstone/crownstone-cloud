// "use strict";


module.exports = function(model) {
  let app = require('../../server/server');

  const initSphereTrackingNumber = function(ctx, next) {
    let item = ctx.instance;

    model.findOne({where: {sphereId: item.sphereId}, order: "createdAt DESC"})
      .then((lastTrackingNumber) => {
        if (!lastTrackingNumber) {
          item['trackingNumber'] = hash(1);
        }
        else {
          item['trackingNumber'] = hash(reverseHash(lastTrackingNumber.trackingNumber) + 1);
        }
        next();
      })
      .catch((err) => {
        next(err)
      })
  }

  const hash = function(number) {
    return number;
  }

  const reverseHash = function(hashedNumber) {
    return hashedNumber;
  }

  model.observe('before save', initSphereTrackingNumber);
};
