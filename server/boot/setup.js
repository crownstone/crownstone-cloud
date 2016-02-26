// module.exports = function(app) {

// 	app.models().forEach(function(Model) {
// 		console.log(Model.modelName);
// 		// console.log(Model.sharedClass);
// 		Model.sharedClass.methods().forEach(function(method) {
// 			if (method.name.indexOf('updateById') > 0) {
// 				console.log("   " + method.name);
// 			}
// 		})
// 		// Model.disableRemoteMethod('updateAttributes', false);
// 	})

// 	// app.remotes().methods().forEach(function(method) {
// 	// 	comnsole.log(method.name);
// 	// })

// }
