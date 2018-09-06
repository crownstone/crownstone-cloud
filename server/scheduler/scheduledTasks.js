let cleanActivityLogs = require('./actions/cleanActivityLogs')
let refreshToonSchedules = require('./actions/refreshToonSchedules')

let scheduledTasks = [
  {id:"activityLogMaintenance", action: cleanActivityLogs, crontime: "00 00 0-23/4 * * *"},
  {id:"toonSchedule",           action: refreshToonSchedules, crontime: "15 00 0 * * *"     },
];


module.exports = scheduledTasks;
