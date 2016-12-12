var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

var runner = {

	update : function(scan, deviceInstance, user) {
		// debug('update location based on scans from device', deviceInstance.name);
		this.useClosestBeacon(scan, deviceInstance, user);
	},

	useClosestBeacon : function(scan, deviceInstance, user) {
		// console.log('scan:', scan);
		// debug('scan.scannedDevices:', scan.scannedDevices);

		var Stone = loopback.getModel('Stone');
		var Device = loopback.getModel('Device');

		var maxRssi = -255;
		var closest = null;
		for (i = 0; i < scan.scannedDevices.length; ++i) {
			sd = scan.scannedDevices[i];
			// debug("sd:", sd);
			if (sd.rssi > maxRssi) {
				maxRssi = sd.rssi;
				closest = sd;
			}
		}

		// debug("closest: ", closest);

		Stone.findLocation(null, closest.addlocationss, function(err, locations) {
			if (!err && locations) {
				// console.log('location: ' + locations[0].name );

				Device.setCurrentLocation(deviceInstance, locations[0].id);

				// deviceInstance.currentLocationId = locations[0].id;
				// console.log('deviceInstance:', deviceInstance);
				// Device.upsert(deviceInstance, function(err, obj) {
				// 	if (err) {
				// 		debug("Error: failed to update device");
				// 	} else {
				// 		debug('ok');
				// 	}
				// })
			} else {
				debug("Error: failed to find location");
				//todo: handle the case where closest beacon is not assigned to a location?
			}
		});

	}

}

module.exports = runner;
