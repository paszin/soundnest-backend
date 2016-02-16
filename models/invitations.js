var mongoose = require("mongoose");

var invitationsSchema = new mongoose.Schema({
	code: String,
	message: String,
	added_at: {
		type: Date,
		default: Date.now
	},
	added_by_name: String
});



mongoose.model("Invitations", invitationsSchema);

module.exports = mongoose.model("Invitations");
