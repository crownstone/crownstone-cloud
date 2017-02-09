const request = require('request');
const format = require('util').format;
const debug = require('debug')('loopback:dobots');

module.exports = function(model) {

	const BASE_URL = 'https://raw.githubusercontent.com/crownstone/bluenet-release/master/'
	const INDEX_URL = BASE_URL + 'index.json';
	const HEX_URL = BASE_URL + "%s_%s/bin/%s.hex"

	model.getIndex = function(cb) {
		debug("INDEX_URL", INDEX_URL);
		var options = {
			url: INDEX_URL,
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate'
			}
		};
		request(options, function(error, response, body) {
			if (error) return cb(error);

			debug("index", body);

			cb(null, JSON.parse(body));
		});
	}

	model.checkVersion = function(type, version, cb) {
		model.getIndex(function(err, index) {
			if (err) return cb(err);

			cb(null, index[type].versions.indexOf(version) >= 0);
		})
	}

	model.getFileUrl = function(type, version) {
		if (type == 'crownstone') {
			// todo: only for test
			return format(HEX_URL, 'crownstone_plug', version,  'crownstone');
		} else {
			return format(HEX_URL, type, version, type);
		}
	}

	model.downloadLatest = function(type, res, cb) {
		debug("downloadLatest");

		model.getIndex(function(err, index) {
			if (err) {
				debug("error", error);
				// var error = new Error("Could not retrieve index");
				// error.statusCode = 400;
				// return cb(error);
				return cb(err);
			}

			var version = index[type].latest;

			var url = model.getFileUrl(type, version);
			debug("url", url);
			res.redirect(url);

		});
	}

	model.remoteMethod(
		'downloadLatest',
		{
			http: {path: '/latest', verb: 'get'},
			accepts: [
				{arg: 'type', type: 'string', required: true, http: { source : 'query' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download latest firmware"
		}
	);

	model.downloadStable = function(type, res, cb) {
		debug("downloadStable");

		model.getIndex(function(err, index) {
			if (err) {
				debug("error", error);
				// var error = new Error("Could not retrieve index");
				// error.statusCode = 400;
				// return cb(error);
				return cb(err);
			}

			var version = index[type].stable;

			var url = model.getFileUrl(type, version);
			debug("url", url);
			res.redirect(url);

		});
	}

	model.remoteMethod(
		'downloadStable',
		{
			http: {path: '/stable', verb: 'get'},
			accepts: [
				{arg: 'type', type: 'string', required: true, http: { source : 'query' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download stable firmware"
		}
	);

	model.getVersions = function(type, since, cb) {
		debug("getVersions");

		model.getIndex(function(err, index) {
			if (err) {
				debug("error", error);
				// var error = new Error("Could not retrieve index");
				// error.statusCode = 400;
				// return cb(error);
				return cb(err);
			}

			if (since) {
				debug("since", since);
				filteredVersions = Array.from(index[type].versions)
					.filter(function(version) {
						// filter all versions for versions released after since timestamp
						return since < new Date(index[type].time[version])
					});
				cb(null, filteredVersions);

			} else {
				// no timestamp, return all versions
				cb(null, index[type].versions);
			}
		});
	}

	model.remoteMethod(
		'getVersions',
		{
			http: {path: '/versions', verb: 'get'},
			accepts: [
				{arg: 'type', type: 'string', required: true, http: { source : 'query' }},
				{arg: 'since', type: 'date', required: false, http: { source : 'query' }}
			],
			returns: [
				{arg: 'versions', type: ['string']}
			],
			description: "Get available versions"
		}
	);

	model.getLastModified = function(type, cb) {
		debug("getLastModified");

		model.getIndex(function(err, index) {
			if (err) {
				debug("error", error);
				// var error = new Error("Could not retrieve index");
				// error.statusCode = 400;
				// return cb(error);
				return cb(err);
			}

			cb(null, index[type].time.modified);
		});
	}

	model.remoteMethod(
		'getLastModified',
		{
			http: {path: '/lastModified', verb: 'get'},
			accepts: [
				{arg: 'type', type: 'string', required: true, http: { source : 'query' }}
			],
			returns: [
				{arg: 'timestamp', type: 'date'}
			],
			description: "Get last modified timestamp"
		}
	);

	model.downloadVersion = function(version, type, res, cb) {
		debug("downloadVersion");

		model.checkVersion(type, version, function(err, found) {
			if (err) return cb(err);

			if (!found) {
				var error = new Error(format("Could not find version '%s' for type '%s'", version, type));
				error.statusCode = 400;
				return cb(error);
			} else {

				var url = model.getFileUrl(type, version);
				debug("url", url);
				res.redirect(url);
			}
		})
	}

	model.remoteMethod(
		'downloadVersion',
		{
			http: {path: '/:version', verb: 'get'},
			accepts: [
				{arg: 'version', type: 'string', required: true, http: { source : 'path' }},
				{arg: 'type', type: 'string', required: true, http: { source : 'query' }},
				{arg: 'res', type: 'object', 'http': { source: 'res' }}
			],
			description: "Download firmware by version number"
		}
	);


};