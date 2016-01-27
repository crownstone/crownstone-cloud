module.exports = {
  mongoDs: {
    "connector": "loopback-connector-mongodb",
    "host": "dobots.customers.luna.net",
    "port": 47474,
    "database": process.env.MONGODB_DATABASE,
    "username": process.env.MONGODB_USER,
    "password": process.env.MONGODB_PASSWORD
  },
  "sendgridDs": {
    "connector": "loopback-connector-sendgrid",
    "api_user": process.env.SENDGRID_USERNAME,
    "api_key": process.env.SENDGRID_PASSWORD
  }
}
