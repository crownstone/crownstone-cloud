"use strict";

const loopback = require('loopback');
const uuid = require('node-uuid');
const crypto = require('crypto');

const debug = require('debug')('loopback:dobots');

const config = require('../../server/config.json');
const emailUtil = require('../../server/emails/util');
const mesh = require('../../server/middleware/mesh-access-address');

module.exports = function(model) {


  /************************************
   **** Model Validation
   ************************************/

  model.validatesUniquenessOf('name', {message: 'an Application with this name was already added'});


};
