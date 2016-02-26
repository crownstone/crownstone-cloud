var loopback = require('loopback');
var util = require('util');

selectedDataSource = undefined;

module.exports = {

	update : function(user, app, next) {

		if (user) {
			console.log("realm: " + user.realm)
		}
		if (user && user.realm) {
			var wait = false;
			if (!app.dataSources[user.realm] || selectedDataSource != app.dataSources[user.realm]) {
				if (!app.dataSources[user.realm]) {
					console.log("creating dataSource " + user.realm)
					url = util.format(app.get('db_url'), user.realm)
					// console.log("url: " + url)
					app.dataSources[user.realm] = loopback.createDataSource({
						connector: "mongodb",
						name: user.realm,
						url: url,
						server: {
							sslValidate: false
						}
					});
					app.dataSources[user.realm].on('connected', function() {
						next();
					});
					wait = true;
				}

				console.log("using " + user.realm)
				selectedDataSource = app.dataSources[user.realm];
			}
			if (!wait) {
				next();
			}
		} else {
			if (selectedDataSource != app.dataSources.mongoDs) {
				console.log("using dev");
				selectedDataSource = app.dataSources.mongoDs;
			}
			next();
		}
	},

	getDataSource : function(model) {
		// console.log("selectedDataSource ", selectedDataSource ? selectedDataSource.settings.name : selectedDataSource);
		// console.log(model.dataSource.settings.name);
		// console.log("old datasource:", model.dataSource.settings.name);
		if (selectedDataSource != null && model.dataSource != selectedDataSource) {
			console.log("attaching datasource", selectedDataSource ? selectedDataSource.settings.name : selectedDataSource);
			selectedDataSource.attach(model);
		}
		return selectedDataSource;
	},
}

