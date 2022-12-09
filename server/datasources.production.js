module.exports = {
  mongoDs: {
    "connector": "loopback-connector-mongodb",
    "name": process.env.DATA_TABLE,
    "url": "mongodb://" + (process.env.DATA_DB_URL || (+ process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/"
                        + process.env.DATA_TABLE + "?authSource=admin&ssl=true&sslValidate=false")),
  },
  userDs: {
    "connector": "loopback-connector-mongodb",
    "name": process.env.USER_TABLE,
    "url": "mongodb://" + (process.env.USER_DB_URL || (+ process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/"
                        + process.env.USER_TABLE + "?authSource=admin&ssl=true&sslValidate=false")),
  },
  filesDs: {
    "connector": "loopback-component-storage-gridfs",
    "name": process.env.FILES_TABLE,
    "url": "mongodb://" + (process.env.FILES_DB_URL || (
                          process.env.MONGODB_USER + ":"
                        + process.env.MONGODB_PASSWORD + "@"
                        + process.env.MONGODB_HOST + ":"
                        + process.env.MONGODB_PORT + "/"
                        + process.env.FILES_TABLE + "?authSource=admin&ssl=true&sslValidate=false")),
  },
  "sendgrid": {
    "connector": "loopback-connector-sendgrid",
    "api_key": process.env.SENDGRID_API_KEY
  },
  gmail: {
    "name": "gmail",
    "connector": "mail",
    "transports": [{
      "type": "SMTP",
      "host": "smtp.gmail.com",
      "secure": true,
      "port": 465,
      "auth": {
        "user": process.env.MAIL_USER,
        "pass": process.env.MAIL_PASSWORD
      }
    }]
  }
};
