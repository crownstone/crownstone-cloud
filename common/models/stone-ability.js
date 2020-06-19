"use strict";
const EventHandler = require('../../server/modules/EventHandler');

module.exports = function(model) {

  function afterSave(ctx, next) {
    let ability = ctx.instance;
    if (ability) {
      return EventHandler.dataChange.sendAbilityChangeEventByIds(ability.sphereId, ability.stoneId, ability);
    }
    next();
  }

  model.observe('after save', afterSave);
};
