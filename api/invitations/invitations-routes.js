
var Joi = require("joi");


exports.register = function(server, options, next) {

	const Groups = require("../groups/groups-model.js");
	const Invitations = require("./invitations-model.js");


server.route({
	method: "GET",
	path: "/invitations",
	handler: function(request, reply) {
		Invitations.findOne({
			code: request.query.code
		}).then(
			function(invitation) {
				return Groups.findOne({
					id: invitation.group_id
				});
			}).then(function(group) {
			return group.addMember(request.query.user_id);
		}).then(
			function(group) {
				return reply({
					group: group
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
			function() {
				reply().code(201);
			});
	},
	config: {
		validate: {
			payload: {
				code: Joi.string(),
				message: Joi.string(),
				username: Joi.string(),
				group_id: Joi.number().required()
			}
		}
	}
});


	return next();
};

exports.register.attributes = {
	name: "invitations"
};

