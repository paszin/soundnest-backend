var mongoose = require("mongoose");
var Groups = require("./models/groups.js");
mongoose.connect("mongodb://localhost/soundnest");
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));


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


// template
/*
server.route({
	method: "GET",
	path: "/groups",
	handler: function(request, reply) {
			return reply({info: "Hello"});
	}
});
*/


//all groups
server.route({
	method: "GET",
	path: "/groups",
	handler: function(request, reply) {
		Groups.find(function(err, groups) {
			return reply({
				groups: groups
			});
		});
	}
});

// add new group
server.route({
	method: "POST",
	path: "/groups",
	handler: function(request, reply) {
		Groups.add(request.payload.name, request.payload.description, request.payload.user_id)
			.then(function(err, obj) {
				return reply({
					group: obj
				});
			});
	}
});


// get group details (TODO: including all track information)
server.route({
	method: "GET",
	path: "/groups/{id}",
	handler: function(request, reply) {
		Groups.findById(id, function(err, group) {
			return reply({
				group: group
			});
		});
	}
});

// add a track
server.route({
	method: "POST",
	path: "/groups/{id}/tracks",
	handler: function(request, reply) {
		Groups.findOne({
			id: request.params.id
		}).then(
			function(group) {
				group.addTrack(request.payload.track_id, request.payload.user_id)
					.then(reply().code(201));
			});
	}
});



// Start server
server.start((err) => {

	if (err) {
		throw err;
	}
	console.log("Server running at:", server.info.uri);
});