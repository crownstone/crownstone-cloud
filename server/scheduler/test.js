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

execute(scheduledTasks[1])
//
//
// scheduledTasks.forEach((task) => {
//   execute(task)
// })
