const Util = require("../../util/util")
const ToonAPI = require("../../integrations/toon/Toon")

function refreshToonSchedules(mongo) {
  let toonCollection = mongo.dataDb.collection("Toon");

  return toonCollection.find({}).toArray((err, toons) => {
    Util.promiseBatchPerformer(toons, (toon) => {
      return new Promise((resolve, reject) => {
        let tokens = null
        ToonAPI.getAccessToken(toon.refreshToken)
          .then((receivedTokens) => {
            tokens = receivedTokens;
            return ToonAPI.getSchedule(tokens, toon.toonAgreementId);
          })
          .then((schedule) => {
            toonCollection.updateOne(
              { _id: toon._id},
              { refreshToken: tokens.refreshToken, schedule: JSON.stringify(schedule), updatedScheduleTime: new Date().valueOf() },
              (err,result) => {
                resolve();
              }
            );
          })
      })
    })
  })

}


module.exports = refreshToonSchedules;
