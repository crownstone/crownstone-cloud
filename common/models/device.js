module.exports = function(Device) {

	// address has to be unique to a beacon
	Device.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

};
