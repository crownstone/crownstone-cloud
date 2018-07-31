const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

let datasources = require('./datasources.' + (process.env.NODE_ENV || 'local'));



class MongoDbConnector {

  constructor() {
    this.userDb = null;
    this.dataDb = null;
    this.mongoClient = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      let url = datasources.mongoDs.url;

      // Use connect method to connect to the server
      MongoClient.connect(url, function(err, client) {
        return reject(err);
        console.log("Connected successfully to mongo server");

        this.userDb = client.db(datasources.userDs.name);
        this.dataDb = client.db(datasources.mongoDs.name);

        this.mongoClient = client;
        resolve();
      });
    })
  }

  close() {
    this.mongoClient = client.close();
  }
}


module.exports = MongoDbConnector;
