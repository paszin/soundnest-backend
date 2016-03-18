var SC = require("node-soundcloud");
SC.init({
	id: "8cc5ee91d9e6015109dc93302c43e99c"
});

var async = require("async");
const History = require("./history-model.js");


exports.register = function(server, options, next) {


	/**
	 * @api {get} /history Last Tracks the user played
	 * @apiName History
	 * @apiGroup History
	 *
	 * @apiParam {Number} limit
	 * @apiParam {Number} since
	 * @apiParam {Number} until
	 *
	 */

	server.route({
		method: "GET",
		path: "/history",
		handler: function(request, reply) {
			var limit = parseInt(request.query.limit) || 20;
			History.paginate({
				"user_id": request.query.user_id
			}, {
				"sort": {
					"timestamp": -1
				},
				"limit": limit,
				"offset": parseInt(request.query.offset) || 0
			}).then(
				function(result) {
					var tracks = result.docs;
					async.map(tracks,
						function(item, callback) {
							SC.get("/tracks/" + item.track_id, function merge(err, track) {
								callback(err, {
									sc: track,
									sn: item
								});
							});
						},
						function(err, tracks) {
							reply({
								tracks: tracks,
								total: result.total,
								offset: result.offset,
								nextpath: result.total > result.offset+limit ? "offset=" + (result.offset+limit) : null
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