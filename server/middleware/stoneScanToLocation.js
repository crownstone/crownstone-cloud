var loopback = require('loopback');

const debug = require('debug')('loopback:dobots');

var runner = {

	update : function(scan, stoneInstance, user) {
		debug('udpate location based on scans from stone', stoneInstance.name);
		this.useClosest(scan, stoneInstance, user);
	},

	compareId : function(id1, id2) {
		return new String(id1).valueOf() === new String(id2).valueOf();
	},

	updateDeviceLocation : function(closest, stone) {
		debug("updateDeviceLocation");
		var Device = loopback.getModel('Device');
		var Stone = loopback.getModel('Stone');

		Device.findOne(
			{where: {address: closest.deviceAddress}},
			function(err, device) {
				if (err) {
					return debug("Error:", err);
				} else if (!device) {
					return debug("No device found with this address:", closest.deviceAddress);
				}

				Stone.findLocation(null, stone.address,
					function(err, location) {
						if (err){
							return debug("Error:", err);
						} else if (!location) {
							return debug("No location found with this address");
						}

						debug('location: ' + location[0].name );

						if (!runner.compareId(device.currentLocationId, location[0].id)) {
							device.currentLocationId = location[0].id;
							debug("save device:", device);
							device.save();
						}
					}
					);
			}
			);
	},

	filterDevices : function(scan, cb) {

		const Device = loopback.getModel('Device');
		Device.find(function(err, devices) {
			if (err) return cb(err);

			scanAddresses = Array.from(scan.scannedDevices, dev => dev.address);
			// debug("scanAddresses:", scanAddresses);
			deviceAddresses = Array.from(devices, dev => dev.address);
			// debug("deviceAddresses:", deviceAddresses)

			scannedDevices = scan.scannedDevices.filter(dev => deviceAddresses.indexOf(dev.address) >= 0);

			// debug("filtered scannedDevices:", scannedDevices)

			cb(null, scannedDevices);
		});
	},

	useClosest : function(scan, stoneInstance, user) {
		// console.log('scan:', scan);
		// debug('scan.scannedDevices:', scan.scannedDevices);

		var updates = [];

		runner.filterDevices(scan, function(err, scannedDevices) {
			if (err) return cb(err);

			if (scannedDevices.length > 0) {

				// debug('scan.scannedDevices:', scan.scannedDevices);
				debug("filtered scannedDevices:", scannedDevices)

				var ClosestStone = loopback.getModel('ClosestStone');
				ClosestStone.find(function(err, stones) {
					if (err) return cb(err);

					// debug('closestStones:', stones);

					for (i = 0; i < scannedDevices.length; ++i) {
						var sd = scannedDevices[i];
						debug("sd:", sd);
						var found = false;
						for (j = 0; j < stones.length; ++j) {
							var closest = stones[j];
							// debug("closest:", closest);
							if (sd.address === closest.deviceAddress) {
								found = true;
								if (sd.rssi > closest.rssi) {
									debug('closer', closest);
									closest.rssi = sd.rssi;
									closest.stoneId = stoneInstance.id;
									// updates.push(j);
									updates.push(closest);
									// todo: continue
								} else if (sd.rssi < closest.rssi &&
										   runner.compareId(stoneInstance.id, closest.stoneId))
								{
									debug('farther', closest);
									closest.rssi = sd.rssi;
									updates.push(closest);
									// updates.push(j);
								}
							}
						}

						if (!found) {
							debug("creating")
							ClosestStone.create(
								{deviceAddress: sd.address, rssi: sd.rssi, stoneId: stoneInstance.id},
								function(err, instance) {
									if (err) {
										debug("Error, failed to create closest stone")
									}
									debug("success");
									runner.updateDeviceLocation(instance, stoneInstance);
								}
							);
						}
					}

					// var Device = loopback.getModel('Device');
					// var Stone = loopback.getModel('Stone');

					for (i = 0; i < updates.length; ++i) {
						debug("save closest:", updates[i]);
						updates[i].save();

						runner.updateDeviceLocation(updates[i], stoneInstance);

						// Device.findOne(
						// 	{where: {address: updates[i].deviceAddress}},
						// 	function(err, device) {
						// 		if (err) {
						// 			return debug("Error, could not find device with address " + updates[i].deviceAddress);
						// 		}

						// 		Stone.findLocation(null, stoneInstance.address,
						// 			function(err, location) {
						// 				if (err){
						// 					return debug("Error: failed to get location");
						// 				}

						// 				debug('location: ' + location[0].name );

						// 				device.currentLocationId = location[0].id;
						// 				debug("save device:", device);
						// 				device.save();
						// 			}
						// 		);
						// 	}
						// );





						// index = updates[i];
						// ClosestStone.upsert(stones)
					}
				});
			}
		});
	}

}

module.exports = runner;
