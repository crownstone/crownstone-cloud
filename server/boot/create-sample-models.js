// var async = require('async');
// module.exports = function(app) {
//   //data sources
//   // var db = app.dataSources.db;
//   var db = app.dataSources.mongoDs;
//   //create all models
//   async.parallel({
//     locations: async.apply(createLocations),
//     stones: async.apply(createStones),
//   }, function(err, results) {
//     if (err) throw err;
//     // createStones(results.locations, function(err) {
//     console.log('ok');
//     createRelations(results.locations, results.stones, function(err) {
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
//   function createStones(cb) {
//     db.automigrate('Stone', function(err) {
//       if (err) return cb(err);
//       var Stone = app.models.Stone;
//       Stone.create([
//         {name: 'Stone 1', address: 'D7:59:D6:BD:2A:5A'},
//         {name: 'Stone 2', address: 'DE:41:8E:2F:58:85'},
//         {name: 'Stone 3', address: 'D7:D5:51:82:49:43'},
//         {name: 'Stone 4', address: 'FD:CB:99:58:0B:88'},
//       ], cb);
//     });
//   }
//   //create reviews
//   function createRelations(locations, stones, cb) {
//     db.automigrate('StoneLocation', function(err) {
//       if (err) return cb(err);
//       var StoneLocation = app.models.StoneLocation;
//       console.log('creating StoneLocation');
//       StoneLocation.create([
//         {locationId: locations[0].id, stoneId: stones[3].id},
//         {locationId: locations[1].id, stoneId: stones[2].id},
//         {locationId: locations[2].id, stoneId: stones[1].id},
//         {locationId: locations[3].id, stoneId: stones[0].id},
//         // {locationId: locations[4].id, stoneId: stones[0].id},
//         // {locationId: locations[4].id, stoneId: stones[1].id},
//         // {locationId: locations[4].id, stoneId: stones[2].id},
//         // {locationId: locations[4].id, stoneId: stones[3].id},
//       ], cb);

//       // var Location = app.models.Location;
//       // var Stone = app.models.Stone;
//       // console.log(JSON.stringify(Location));
//       // console.log(JSON.stringify(Stone));
//       // Stone.locations.link({locationId: locations[0].id, stoneId: stones[3].id}, locations[0], function(value, header) {
//       //   console.log("link success");
//       // })
//     });
//   }
// };
