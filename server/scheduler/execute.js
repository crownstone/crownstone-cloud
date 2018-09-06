let MongoDbConnector = require('./MongoDbConnector');

function execute(task) {
  console.log("CRONJOBS: Setting up execution of", task.id, "...");
  let mongo = new MongoDbConnector();
  mongo.connect()
    .then(() => {
      console.log("CRONJOBS: Executing:", task.id);
      return task.action(mongo);
    })
    .then(() => {
      console.log("CRONJOBS: Finished:", task.id);
      mongo.close();
    })
    .catch((err) => {
      console.log("CRONJOBS: Failed:", task.id, err);
      mongo.close();
    })
}


module.exports = execute;
