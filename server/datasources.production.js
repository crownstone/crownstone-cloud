module.exports = {
  // mongoDsRealm: {
  //   "connector": "loopback-connector-mongodb",
  //   "url": "mongodb://" + process.env.MONGODB_USER + ":"
  //                       + process.env.MONGODB_PASSWORD + "@"
  //                       + process.env.MONGODB_HOST + ":"
  //                       + process.env.MONGODB_PORT + "/%s?authSource=admin"
  // },
  mongoDs: {
    "connector": "loopback-connector-mongodb",
    "name": "dev",
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/dev?authSource=admin&ssl=true",
    "server": {
      "sslValidate": false
    }
  },
  userDs: {
    "connector": "loopback-connector-mongodb",
    "name": "user",
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/users?authSource=admin&ssl=true",
    "server": {
      "sslValidate": false
    }
  },
  filesDs: {
    "connector": "loopback-component-storage-gridfs",
    "name": "files",
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/files?authSource=admin&ssl=true",
    "server": {
      "sslValidate": false
    }
  },
  "sendgridDs": {
    "connector": "loopback-connector-sendgrid",
    "api_user": process.env.SENDGRID_USERNAME,
    "api_key": process.env.SENDGRID_PASSWORD
  }
}
