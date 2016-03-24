var exports = module.exports = {};
var Groups = require("../api/groups/groups-model.js");
var _ = require("lodash");

exports.createGroup = function (data, callback) {
	Groups.remove({}).then(
		function() {
			return Groups.add(data.name || "Group1", data.description || "description", data.added_by || 1);
		}).then(
			callback
		);
};

exports.buildPath = function() {
	return "/" + _.values(arguments).join("/");
}