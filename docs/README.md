# Crownstone Cloud

Usually your smartphone app takes care of interacting with the cloud, but you have full access to all the data that belongs to your
account. The cloud can be used for integrations, such as Google Home, Amazon Alexa, Home assistant and others. We have a few different ways
you can interact with out cloud services.

- REST API
- Libraries
  - Nodejs
  - Python
- Sever Sent Events (SSE)
- Webhooks

Let's go over them one by one to see when you would want to use each one.

### REST API
This API can be found at [https://my.crownstone.rocks/explorer/](https://my.crownstone.rocks/explorer/). These are a lot of endpoints, and you do not need to use most of them.
This is the same interface used by our Crownstone App, which means that many endpoints might only be relevant for our app or other services.

Some endpoints are there for legacy support and should not be used for new integrations.
These are marked as LEGACY in the explorer and will not be covered in the documentation. [More in-depth information can be found here.](./REST.md)

### Libraries

If you don't want to write your own code calling these endpoints, we don't blame you! In order to make using our Cloud easier we have
created a NodeJS and a Python library. These libraries will take care of most common usecases, and if your case is not covered, let us know
so we can improve them! You can find them here:

#### [Python cloud library](https://github.com/crownstone/crownstone-lib-python-cloud)

#### [NodeJS cloud library](https://github.com/crownstone/crownstone-lib-nodejs-cloud)

### Server Sent Events (SSE)

REST endpoints are useful for getting data, but not very useful if you want to be notified when something changes. This can be something like
entering the room, a light turning on, a Crownstone being added to the sphere etc. We'd appreciate it if you would not poll our cloud very frequently, so we've created the SSE server.

This is useful if you want to respond to changes in the Crownstone system/your house from a device that is not reachable via the internet, like a Raspberry Pi at home! You can just listen to the
events and respond to the one you want to respond to. If you have a server which should be called if something happens, you need webhooks.

You can find it here:
#### [https://events.crownstone.rocks](https://events.crownstone.rocks)

There are also libraries available to make it easier to use the events, these are found here:
#### [Python SSE library](https://github.com/crownstone/crownstone-lib-python-sse)
#### [NodeJS SSE library](https://github.com/crownstone/crownstone-lib-nodejs-sse)

### Webhooks

If you have a server that should respond to changes of user location for instance, and you want us to call your endpoints when something changes, webhooks are for you!
The initial implementation of this was done via the hooks in the cloud, but this is being deprecated. Instead, you should use our webhook server:

#### [https://webhooks.crownstone.rocks](https://webhooks.crownstone.rocks)

Here you can forward events that also come over the SSE server to your endpoints. Contact us for a user account here!

## Where to now?

The documentation is split in the following parts:
- [Getting started](./GETTING_STARTED.md)
- [Authorization](./AUTHORIZATION.md)
- [REST endpoint documentation](./REST.md)

