let execute = require('./execute')
let CronJob = require('cron').CronJob;

// new CronJob({
//   cronTime:
//     "" + // seconds       0-59
//     "* " + // minute        0-59
//     "* " + // hour          0-23
//     "* " + // day of month  1-31
//     "* " + // month         0-12 (or names, see below)
//     "*",   // day of week   0-6 (sim-sat)
//   onTick: fifteenSeconsAfterMinute,
//   start: true,
//   timeZone: "Europe/Amsterdam"
// });


let scheduledTasks = require('./scheduledTasks')

scheduledTasks.forEach((task) => {
  console.log("Setting up Cronjob for " + task.id);
  new CronJob({
    cronTime: task.crontime,
    onTick: () => { execute(task) },
    start: true,
    timeZone: "Europe/Amsterdam"
  });
})
