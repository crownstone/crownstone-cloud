"use strict";

const notificationHandler = require('../../../server/modules/NotificationHandler');

const messageUtils = {
  notifyWithUserObjects: function(message, userObjects) {
    notificationHandler.notifyUsers(userObjects, this._getMessageFormat(message));
  },

  notifyWithUserIds: function(message, userIds) {
    notificationHandler.notifyUserIds(userIds, this._getMessageFormat(message));
  },

  _getMessageFormat: function(message) {
    return {
      title: 'Message Update',
      type:  'messageUpdated',
      silent: true,
      data: {
        sphereId: message.sphereId,
        id: message.id,
        triggerLocationId: message.triggerLocationId,
        triggerEvent: message.triggerEvent,
        senderId: message.ownerId,
        content: message.content,
        command: 'newMessage'
      },
    }
  }
};

module.exports = messageUtils;