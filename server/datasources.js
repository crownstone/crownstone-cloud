module.exports = {
  mongoDs: {
    "connector": "mongodb",
    "host": "ds047474.mongolab.com",
    "port": 47474,
    "database": process.env.MONGODB_DATABASE,
    "username": process.env.MONGODB_USER,
    "password": process.env.MONGODB_PASSWORD
  },
  "sendgridDs": {
    "name": "sendgridDs",
    "connector": "loopback-connector-sendgrid",
    "api_user": process.env.SENDGRID_USERNAME,
    "api_key": process.env.SENDGRID_PASSWORD
  }
}
