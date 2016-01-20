for b in beacons:
	beaconAddress = b['address']

	for d in b['scans'][0]['scannedDevices']:
		update = False
		deviceAddress = d['address']
		if location_dict.has_key(deviceAddress):
			if location_dict[deviceAddress] < d['rssi']:
				update = True
		else:
			location_dict[deviceAddress] = {}
			update = True

		if update:
			location_dict[deviceAddress]['rssi'] = d['rssi']
			location_dict[deviceAddress]['beacon'] = beaconAddress
