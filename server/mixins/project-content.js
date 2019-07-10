"use strict";
let loopback = require('loopback');

module.exports = function(model, options) {

  // define property: sphereId which is used as a reference to the sphere
  // that "owns" the model instance
  model.defineProperty("projectId", {type: "string", required: true});

  // define the belongTo relation to the Sphere. this is necessary to
  // distinguish SphereContent and decide who has access to what content
  var Project = require("loopback").getModel("Project");
  model.belongsTo(Project, { foreignKey: "projectId", as: "owner"});

  model.observe('access', (context, callback) => {
    if (context.options && context.options.accessToken) {
      let userId = context.options.accessToken.userId;
      let possibleIds = [];
      // get get all projectIds the user has access to.
      const projectAccess = loopback.getModel("ProjectAccess");
      projectAccess.find({where: {userId: userId}, fields:{projectId: true}})
        .then((results) => {
          for (let i = 0; i < results.length; i++) {
            possibleIds.push(results[i].projectId);
          }
          return Project.find({where: {ownerId: userId}})
        })
        .then((projects) => {
          for (let i = 0; i < projects.length; i++) {
            possibleIds.push(projects[i].id);
          }
          let filter = {projectId: {inq: possibleIds}};
          const where = context.query.where ? { and: [ context.query.where, filter ] } : filter;
          context.query.where = where;
          console.log(JSON.stringify(context.query, undefined, 2))
          callback();
        })
        .catch((err) => {
          callback(err);
        })
    }
    else {
      callback();
    }

  });
}
