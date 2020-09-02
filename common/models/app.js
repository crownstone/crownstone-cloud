"use strict";

module.exports = function(model) {


  /************************************
   **** Model Validation
   ************************************/

  model.validatesUniquenessOf('name', {message: 'an Application with this name was already added'});

};
