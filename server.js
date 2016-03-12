var mongoose = require("mongoose");
var async = require("async");

var db;
var History = require("./history/history-model.js");



const Hapi = require("hapi");

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
	host: "0.0.0.0",
	port: 8000,
	routes: {
		cors: true
	}
});



function startServer(database, options) {

	mongoose.connect("mongodb://localhost/" + database); //, options);
	db = mongoose.connection;

	db.on("error", console.error.bind(console, "connection error:"));

	server.register([
		require("./groups/groups-routes"),
		require("./invitations/invitations-routes")
	], (err) => {

		if (err) {
			throw err;
		}

		// Start the server
		server.start((err) => {
			console.log("Server running at:", server.info.uri);
		});

	});
}


server.route({
	method: "GET",
	path: "/",
	handler: function(request, reply) {
		return reply("hello world");
	}
});





server.route({
	method: "GET",
	path: "/history",
	handler: function(request, reply) {
		History.find({
			"user_id": request.query.user_id
		}).then(function(tracks) {
			async.map(tracks,
				function(item, callback) {
					SC.get("/tracks/" + item.track_id, function merge(err, track) {
						callback(err, {
							sc: track,
							sn: item
						});
					});
				},
				function(err, result) {
					reply({
						tracks: result
					});
				}
			);
		});
	}
});

server.route({
	method: "POST",
	path: "/history",
	handler: function(request, reply) {
		History.add(request.payload.user_id, request.payload.track_id, request.payload.statistics, 1).then(function(result) {
			reply().code(201);
		});
	}
});


module.exports = {
	server,
	startServer,
	db
};