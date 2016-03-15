var async = require("async");
var SC = require("node-soundcloud");
SC.init({
	id: "8cc5ee91d9e6015109dc93302c43e99c"
});


exports.register = function(server, options, next) {

	const Groups = require("./groups-model.js");

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

	server.route({
		method: "DELETE",
		path: "/groups/{gid}/tracks/{tid}",
		handler: function(request, reply) {
			Groups.update({
				"id": request.params.gid
			}, {
				"$pull": {
					"tracks" : {"$eq": request.params.tid}
				}
			}).then(reply().code(204));
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
				reply({group: group});
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


	return next();
};

exports.register.attributes = {
	name: "groups"
};