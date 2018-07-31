
let MongoDbConnector = require('./MongoDbConnector')

var test = function(){
  let mongo = new MongoDbConnector();
  mongo.connect()
    .then(() => {
      return mongo.userDb.find().count()
    })
    .then((results) => {
      console.log("HERE", results)
      mongo.close();
    })
    .catch((err) => {
      console.log("err", err)
      mongo.close();
    })

}
// setInterval(test, 60000);

console.log(test)

// //For specific times, use a chron job
// var fifteenSeconsAfterMinute = function() {
//   console.log("Another minute is gone forever. Hopefully, you made the most of it...");
// }
// var CronJob = require('cron').CronJob;
// new CronJob({
//   cronTime: "15 * * * * *",//15 seconds after every minute
//   onTick: fifteenSeconsAfterMinute,
//   start: true,
//   timeZone: "America/Los_Angeles"
// });
