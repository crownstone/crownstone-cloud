module.exports = function(model) {

	// address has to be unique to a stone
	model.validatesUniquenessOf('address', {message: 'a device with this address was already added!'});

	model.disableRemoteMethod('__updateById__coordinatesHistory', false);
	model.disableRemoteMethod('__link__coordinatesHistory', false);
	model.disableRemoteMethod('__unlink__coordinatesHistory', false);
	model.disableRemoteMethod('__exists__coordinatesHistory', false);
	model.disableRemoteMethod('__findById__coordinatesHistory', false);

	model.disableRemoteMethod('__updateById__locationsHistory', false);
	model.disableRemoteMethod('__link__locationsHistory', false);
	model.disableRemoteMethod('__unlink__locationsHistory', false);
	model.disableRemoteMethod('__exists__locationsHistory', false);
	model.disableRemoteMethod('__findById__locationsHistory', false);

	model.disableRemoteMethod('__updateById__scans', false);
	model.disableRemoteMethod('__findById__scans', false);

	model.disableRemoteMethod('createChangeStream', true);
};
