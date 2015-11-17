// var async = require('async');
// module.exports = function(app) {
//   //data sources
//   // var db = app.dataSources.db;
//   var db = app.dataSources.mongoDs;
//   //create all models
//   async.parallel({
//     locations: async.apply(createLocations),
//     beacons: async.apply(createBeacons),
//   }, function(err, results) {
//     if (err) throw err;
//     // createBeacons(results.locations, function(err) {
//     console.log('ok');
//     createRelations(results.locations, results.beacons, function(err) {
//       console.log('> models created sucessfully');
//     });
//   });
//   //create reviewers
//   function createLocations(cb) {
//     db.automigrate('Location', function(err) {
//       if (err) return cb(err);
//       var Location = app.models.Location;
//       Location.create([
//         {name: 'DoBots Software'},
//         {name: 'Interns'},
//         {name: 'Peet'},
//         {name: 'Hallway 2'},
//         {name: 'Floor 2'},
//       ], cb);
//     });
//   }
//   //create coffee shops
//   function createBeacons(cb) {
//     db.automigrate('Beacon', function(err) {
//       if (err) return cb(err);
//       var Beacon = app.models.Beacon;
//       Beacon.create([
//         {name: 'Beacon 1', address: 'D7:59:D6:BD:2A:5A'},
//         {name: 'Beacon 2', address: 'DE:41:8E:2F:58:85'},
//         {name: 'Beacon 3', address: 'D7:D5:51:82:49:43'},
//         {name: 'Beacon 4', address: 'FD:CB:99:58:0B:88'},
//       ], cb);
//     });
//   }
//   //create reviews
//   function createRelations(locations, beacons, cb) {
//     db.automigrate('BeaconLocation', function(err) {
//       if (err) return cb(err);
//       var BeaconLocation = app.models.BeaconLocation;
//       console.log('creating BeaconLocation');
//       BeaconLocation.create([
//         {locationId: locations[0].id, beaconId: beacons[3].id},
//         {locationId: locations[1].id, beaconId: beacons[2].id},
//         {locationId: locations[2].id, beaconId: beacons[1].id},
//         {locationId: locations[3].id, beaconId: beacons[0].id},
//         // {locationId: locations[4].id, beaconId: beacons[0].id},
//         // {locationId: locations[4].id, beaconId: beacons[1].id},
//         // {locationId: locations[4].id, beaconId: beacons[2].id},
//         // {locationId: locations[4].id, beaconId: beacons[3].id},
//       ], cb);

//       // var Location = app.models.Location;
//       // var Beacon = app.models.Beacon;
//       // console.log(JSON.stringify(Location));
//       // console.log(JSON.stringify(Beacon));
//       // Beacon.locations.link({locationId: locations[0].id, beaconId: beacons[3].id}, locations[0], function(value, header) {
//       //   console.log("link success");
//       // })
//     });
//   }
// };
