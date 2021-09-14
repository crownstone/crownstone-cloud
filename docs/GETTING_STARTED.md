# Getting Started

This is sort of a cheat sheet that should cover most common questions and usecases.

## Account & Access

[Take a look here for more information on how to access the Crownstone Cloud services](./AUTHORIZATION.md)

## Libraries

We have a number of libraries to get you started without going into the nitty gritty details of the cloud. You can check them out here:
#### [Python cloud library](https://github.com/crownstone/crownstone-lib-python-cloud)
#### [NodeJS cloud library](https://github.com/crownstone/crownstone-lib-nodejs-cloud)
#### [Python SSE library](https://github.com/crownstone/crownstone-lib-python-sse)
#### [NodeJS SSE library](https://github.com/crownstone/crownstone-lib-nodejs-sse)


## Playing around

You can take a look at all the available endpoints via the explorer:

[https://my.crownstone.rocks/explorer](https://my.crownstone.rocks/explorer)

Paste your access token in the box in the top right corner to authorize yourself and have fun!

## User ID

Once you have your access token, you may need your userId. You can use the /users/me or /users/userId endpoints for this.
[More information on the endpoint here.](./models/USERS.md)


## Spheres & Stones

A user is connected to Spheres, and via Spheres, connected to Crownstones. In the cloud we refer to Crownstones as Stones.
These 2 models are probably all you need to get started.

[More on Spheres here.](./models/SPHERES.md)

[More on Stones here.](./models/STONES.md)

## Switching Crownstones

If you want to switch a Crownstone, you can do so from the Stone model. From app 4.5 and higher, you can also switch multiple stones at once
via the Sphere/switchCrownstones endpoint. [More on Stones here.](./models/STONES.md)

## Is the Crownstone on or off?

A Crownstone's switchstate is updated by the phone when the phones switches it. You can look it up in the Stone model via the currentSwitchStateV2 endpoint.
Keep in mind users van opt-out of sharing this data via the privacy settings of the app. [More on Stones here.](./models/STONES.md)

## Power measurement

The cloud does not keep track of the power usage of Crownstones. A Crownstone hub however, does this really well!

## Localization

Using localization data should be done via either the SSE or the Webhook servers. These will give you live updates the moment something changes.

You can use the Sphere/presentPeople or user/currentLocation endpoints for an initial state. Do not poll these!

## Privacy

Users have privacy toggles in their apps. Using these, they can choose whether or not they want their switching of Crownstones or location in sphere be
shared with the cloud. If they do not want to share this information, it is not available in the cloud.

### TODO: Setting Scenes

We're working on a way to quickly set the Scenes via the cloud. More on this after app 4.5.

