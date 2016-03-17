module.exports = function(model) {

	model.disableRemoteMethod('createChangeStream', true);

};
