module.exports = {
  // mongoDsRealm: {
  //   "connector": "loopback-connector-mongodb",
  //   "url": "mongodb://" + process.env.MONGODB_USER + ":"
  //                       + process.env.MONGODB_PASSWORD + "@"
  //                       + process.env.MONGODB_HOST + ":"
  //                       + process.env.MONGODB_PORT + "/%s?authSource=admin"
  // },
  mongoDs: {
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/dev?authSource=admin"
  },
  userDs: {
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/users?authSource=admin"
  },
  "sendgridDs": {
    "connector": "loopback-connector-sendgrid",
    "api_user": process.env.SENDGRID_USERNAME,
    "api_key": process.env.SENDGRID_PASSWORD
  }
}
