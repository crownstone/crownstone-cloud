"use strict";

const idUtil = {
  verifyMongoId: function(id) {
    return /^[0-9a-fA-F]{24}/.test(id);
  }
};

module.exports = idUtil;