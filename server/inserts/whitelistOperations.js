

function performWhitelistOperations(app) {
  let whitelistModel = app.dataSources.mongoDs.getModel('HooksWhitelist');

  //clearWhitelistDatabase(whitelistModel);
  // addToWhitelist(whitelistModel, '', 'localhost');
  //  addToWhitelist(whitelistModel, 'mitel', 'io');
   // addToWhitelist(whitelistModel, 'annevanrossum', 'com');
}

function clearWhitelistDatabase(whitelistModel) {
  return whitelistModel.destroyAll()
    .then(() => { console.log("ALL WHITELIST ENTRIES REMOVED"); })
}

function deleteWhitelistedEntry(whitelistModel, domain, tld) {
  return whitelistModel.findOne({where: {and: [{ domain }, { tld }]}})
    .then((results) => {
      let deletionPromises = [];
      results.forEach((result) => {
        deletionPromises.push(whitelistModel.destroyById(result.id))
      });
      return Promise.all(deletionPromises);
    })
}

function addToWhitelist(whitelistModel, domain, tld) {
  return whitelistModel.create({
    domain: domain,
    tld: tld,
  })
    .then((result) => {
      console.log("Domain ",domain,'.', tld, " added successfully!");
      console.log("result:", result);
    })
    .catch((err) => { console.log("Error adding entry:", err); })
}






module.exports = performWhitelistOperations;
