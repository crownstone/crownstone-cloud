const IOServer = require('socket.io');
const crypto = require("crypto");
const loopback = require('loopback');

let config  = require('../config.' + (process.env.NODE_ENV || 'local'));

const S4 = function () {
  return Math.floor(Math.random() * 0x10000 /* 65536 */).toString(16);
};

const getShortUUID = function() {
  return (
    S4() + S4() + '-' +
    S4()
  );
}

const EVENT_ROOM_NAME = "/SSE_EVENTS";

const protocolTopics = {
  requestForAccessTokenCheck: "requestForAccessTokenCheck",
  authenticationRequest: "authenticationRequest",
  event: "event",

}



class SSEManagerClass {
  // io = null;
  // connections = {};

  constructor() {
    this.io = null;
    this.connections = {};
  }

  init(server) {
    this.io = new IOServer(server, { pintInterval: 4000, pingTimeout: 2000, transports:["websocket"], cookie:false })
    this.io.on('connect', (socket) => {
      let uid = getShortUUID()
      this.connections[uid] = new SSEConnection(socket, () => { delete this.connections[uid]; })
    });
  }

  emit(data) {
    this.io.sockets.in(EVENT_ROOM_NAME).emit(protocolTopics.event, data)
  }
}

const SSEManager = new SSEManagerClass()
module.exports = SSEManager;



class SSEConnection {

  // socket = null;
  // cleanup = null;
  // authenticationTimeout = null;
  // handshake = null;

  constructor(socket, cleanup) {
    this.socket = null;
    this.cleanup = null;
    this.authenticationTimeout = null;
    this.handshake = null;

    this.handshake = crypto.randomBytes(16).toString('base64')

    this.socket = socket;
    this.cleanup = cleanup;

    // client gets 500 ms to authenticate
    this.authenticationTimeout = setTimeout(() => { this.destroy(); }, 500);

    // here we ensure only our SSE servers will connect to this socket before sending data.
    this.socket.emit(protocolTopics.authenticationRequest, this.handshake, (reply) => {
      if (this.authenticate(reply) === false) { this.destroy(); return; }
      clearTimeout(this.authenticationTimeout);

      // add to the list of sockets that can process SSE's
      this.socket.join(EVENT_ROOM_NAME, (err) => {
        if (err) { return this.destroy(); }
      });

      // check if an accesstoken is valid.
      this.socket.on(protocolTopics.requestForAccessTokenCheck, (token, callback) => {
        this.handleAccessTokenRequest(token, callback);
      })
    });

    this.socket.on("disconnect", () => { this.destroy(); });
  }


  destroy() {
    this.socket.disconnect(true);
    clearTimeout(this.authenticationTimeout);
    this.cleanup();
  }


  authenticate(reply) {
    let hasher = crypto.createHash('sha256');
    let output = hasher.update(this.handshake + config.SSEToken).digest('hex')
    return reply === output;
  }


  _isValidAccessToken(token) {
    const AccessTokens = loopback.getModel('AccessToken');
    const SphereAccess = loopback.getModel('SphereAccess');
    return new Promise((resolve, reject) => {
      let resultTokenData = {
        accessToken: token,
        ttl: 0,
        createdAt: 0,
        userId: null,
        spheres: {}
      };

      // get the token from the db, if successful,
      AccessTokens.findById(token)
        .then((data) => {
          if (!data) { throw "INVALID_TOKEN" }
          if (new Date().valueOf() < new Date(data.createdAt).valueOf() + data.ttl*1000) {
            throw "EXPIRED_TOKEN"
          }
          resultTokenData.ttl = data.ttl;
          resultTokenData.createdAt = data.created;

          resultTokenData.userId = data.userId;
          return SphereAccess.find({where: {and: [{userId: data.userId}, {invitePending: {neq: true}}]}, fields: "sphereId"})
        })
        .then((sphereIdObjectArray) => {
          for (let i = 0; i < sphereIdObjectArray.length; i++) {
            resultTokenData.spheres[sphereIdObjectArray[i].sphereId] = true;
          }
          resolve(resultTokenData);
        })
        .catch((err) => {
          reject(err)
        });
    })
  }

  handleAccessTokenRequest(token, callback) {
    this._isValidAccessToken(token)
      .then((result) => {
        if (!result) { throw "Invalid Token" }

        callback({code: 200, data: result});
      })
      .catch((err) => {
        return callback({code: 401, err: err});
      })
  }

}
