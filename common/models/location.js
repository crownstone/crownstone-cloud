module.exports = function(model) {

	model.disableRemoteMethod('createChangeStream', true);

	model.disableRemoteMethod('__link__presentPeople', false);
	model.disableRemoteMethod('__unlink__presentPeople', false);
	model.disableRemoteMethod('__findById__presentPeople', false);
	model.disableRemoteMethod('__updateById__presentPeople', false);
	model.disableRemoteMethod('__destroyById__presentPeople', false);
	model.disableRemoteMethod('__create__presentPeople', false);
	model.disableRemoteMethod('__delete__presentPeople', false);

};
