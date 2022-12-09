# Crownstone REST API

The crownstone rest api is running on heroku and is available at https://cloud.crownstone.rocks.
The base url for the rest api is https://cloud.crownstone.rocks/api. The endpoints are then appended to the base url. E.g. `POST /users/login` becomes `POST https://cloud.crownstone.rocks/api/users/login`

An overview of the available endpoints can be found at https://cloud.crownstone.rocks/explorer. The endpoints describe the parameters as well as the responses.

## Documentation

[You can find the user documentation here.](./docs/README.md)

## Running it locally

For Debug purposes, the rest api can be run locally. It can still connect to the database where the data is stored,
but for that to work a file datasources.local.js is needed with the access paths to the database.
Without that file, it will use local memory to store the data.

After cloning the repo, call

	yarn

to install all node dependencies.

Once that completes, the api can be started with

	npm start

in which case it starts the debug version where all endpoints are open. To get the same production version, use

	NODE_ENV=prod node.

# License

## Open-source license

This software is provided under a noncontagious open-source license towards the open-source community. It's available under three open-source licenses:
 
* License: LGPL v3+, Apache, MIT

<p align="center">
  <a href="http://www.gnu.org/licenses/lgpl-3.0">
    <img src="https://img.shields.io/badge/License-LGPL%20v3-blue.svg" alt="License: LGPL v3" />
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
  </a>
  <a href="https://opensource.org/licenses/Apache-2.0">
    <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License: Apache 2.0" />
  </a>
</p>

## Commercial license

This software can also be provided under a commercial license. If you are not an open-source developer or are not planning to release adaptations to the code under one or multiple of the mentioned licenses, contact us to obtain a commercial license.

* License: Crownstone commercial license

# Contact

For any question contact us at <https://crownstone.rocks/contact/> or on our discord server through <https://crownstone.rocks/forum/>.
