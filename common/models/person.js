module.exports = function(Person) {

	Person.validatesUniquenessOf('customId', {message: 'a person with this custom Id was already added!'});

};
