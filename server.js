var mongoose = require("mongoose");
var async = require("async");
var Groups = require("./models/groups.js");
var History = require("./models/history.js");
var Invitations = require("./models/invitations.js");
var SC = require("node-soundcloud");
mongoose.connect("mongodb://localhost/soundnest");
var db = mongoose.connection;

db.on("error", console.error.bind(console, "connection error:"));

SC.init({
	id: "8cc5ee91d9e6015109dc93302c43e99c"
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



// Start server
function startServer() {
	server.start((err) => {

		if (err) {
			throw err;
		}
		console.log("Server running at:", server.info.uri);
	});

}


server.route({
	method: "GET",
	path: "/",
	handler: function(request, reply) {
		return reply("hello world");
	}
});



//all groups
server.route({
	method: "GET",
	path: "/groups",
	handler: function(request, reply) {
		Groups.find({
			"members.id": request.query.user_id
		}).then(
			function(groups) {
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
				async.map(group.tracks,
					function(item, callback) {
						SC.get("/tracks/" + item.id, function merge(err, track) {
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


// add a track
server.route({
	method: "POST",
	path: "/groups/{id}/tracks",
	handler: function(request, reply) {
		Groups.findOne({
			id: request.params.id
		}).then(
			function(group) {
				group.addTrack(request.payload.track_id, request.payload.user_id, request.payload.comment)
					.then(reply().code(201));
			});
	}
});

server.route({
	method: "GET",
	path: "/groups/{id}/members",
	handler: function(request, reply) {
		//add avatar and name to members
		Groups.findOne({
			id: request.params.id
		}).then(
			function(group) {
				async.map(group.members,
					function(member, callback) {
						SC.get("/users/" + member.id,
							function sccallback(err, user) {
								callback(err, {
									sn: member,
									sc: user
								});
							});
					},
					function(err, result) {
						reply({
							members: result
						});
					});
			}
		);
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
		Groups.findOne({
				id: request.query.gid
			}).then(function(group) {
				return group.addMember(request.payload.user_id);
			})
			.then(reply().code(201));
	}
});


server.route({
	method: "GET",
	path: "/invitations",
	handler: function(request, reply) {
		Invitations.findOne({
				code: request.query.code
			})
			.then(
				function(invitation) {
					return Groups.findOne({
						id: invitation.group_id
					});
				})
			.then(
				function(group) {
					if (_.find(group.members, {
							id: request.query.user_id
						})) {
						reply().code(200);
					} else {
						return {
							group: group,
							resp: group.addMember(request.query.user_id)
						};
					}
				})
			.then(
				function(data) {
					reply({
						group: data.group
					}).code(201);
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
			added_by_name: request.payload.username,
			group_id: request.payload.group_id
		}).then(
			function(result) {
				reply().code(201);
			});
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
	server: server,
	startServer: startServer
};