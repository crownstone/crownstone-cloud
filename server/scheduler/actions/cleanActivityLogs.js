

function cleanActivityLogs(mongo) {
  let activityLogCollection = mongo.dataDb.collection("ActivityLog");

  let thresholdTime = new Date().valueOf() - 1*24*3600*1000;
  
  return activityLogCollection.deleteMany({timestamp: { "$lt":thresholdTime }});
}


module.exports = cleanActivityLogs;
