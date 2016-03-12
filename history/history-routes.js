var SC = require("node-soundcloud");
SC.init({
	id: "8cc5ee91d9e6015109dc93302c43e99c"
});
var async = require("async");


exports.register = function(server, options, next) {

	const History = require("./history-model.js");

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

	return next();
};

exports.register.attributes = {
	name: "history"
};