module.exports = {
  mongoDs: {
    "connector": "loopback-connector-mongodb",
    "name": process.env.DATA_TABLE,
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/"
                        + process.env.DATA_TABLE + "?authSource=admin&ssl=true",
  },
  userDs: {
    "connector": "loopback-connector-mongodb",
    "name": process.env.USER_TABLE,
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/"
                        + process.env.USER_TABLE + "?authSource=admin&ssl=true",
  },
  filesDs: {
    "connector": "loopback-component-storage-gridfs",
    "name": process.env.FILES_TABLE,
    "url": "mongodb://" + process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/"
                        + process.env.FILES_TABLE + "?authSource=admin&ssl=true",
  },
  "sendgridDs": {
    "connector": "loopback-connector-sendgrid",
    "api_key": process.env.SENDGRID_API_KEY
  }
};
