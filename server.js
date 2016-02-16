var mongoose = require("mongoose");
var async = require("async");
var Groups = require("./models/groups.js");
var Invitations = require("./models/invitations.js");
var SC = require("node-soundcloud");
mongoose.connect("mongodb://localhost/soundnest");
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

SC.init({
	id: '8cc5ee91d9e6015109dc93302c43e99c'
});


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
			.then(function(obj) {
				reply({
					group: obj
				}).code(201);
			});
	}
});


// get tracklist
server.route({
	method: "GET",
	path: "/groups/{id}/tracks",
	handler: function(request, reply) {

		Groups.findOne({
			id: request.params.id
		}).then(
			function(group) {
				var tracks = group.tracks;
				async.map(group.tracks,
					function(item, callback) {
						SC.get("/tracks/" + item.id, callback);
					},
					function(err, result) {
						console.log(err);
						reply({
							tracks: result
						});
					}
				);
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


//add a comment
server.route({
	method: "POST",
	path: "/groups/{gid}/tracks/{tid}/comments",
	handler: function(request, reply) {
		Groups.update({
			"id": request.params.gid,
			"tracks.id": request.params.tid
		}, {
			"$push": {
				"tracks.$.comments": {
					"text": request.payload.text,
					"author_id": request.payload.user_id
				}
			}
		}).then(function(group) {
			reply().code(201);
		});
	}
});

server.route({
	method: "POST",
	path: "/groups/{gid}/members",
	handler: function(request, reply) {
		Groups.addMember(request.payload.user_id);
	}
});


server.route({
	method: "GET",
	path: "/invitations",
	handler: function(request, reply) {
		Invitations.findOne({
			code: request.query.code
		}).then(
			function(result) {
				console.log(result);
				reply({
					id: result ? result.id: null
				});
			});
	}
});

server.route({
	method: "POST",
	path: "/invitations",
	handler: function(request, reply) {
		Invitations.create({
			code: request.payload.code,
			message: request.payload.message,
			added_by_name: request.payload.username
		}).then(
			function(result) {
				console.log(result);
				reply().code(201);
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