var mongoose = require("mongoose");
var AutoIncrement = require("mongoose-sequence");

var groupsSchema = new mongoose.Schema({
	name: String,
	members: [{
		id: Number
	}],
	description: String,
	tracks: [{
		id: Number,
		added_at: {
			type: Date,
			default: Date.now
		},
		added_by_id: Number,
		comments: [{
			text: String,
			author_id: Number
		}]
	}]
}, {
	id: true
});

groupsSchema.plugin(AutoIncrement, {
	inc_field: "id"
});


// add a new group
groupsSchema.statics.add = function(name, description, added_by) {
	var myGroup = new this({
		name: name,
		description: description
	});
	myGroup.members.push({
		id: added_by
	});
	console.log(myGroup);
	return myGroup.save();
};

groupsSchema.methods.addTrack = function(track_id, added_by_id) {
	this.tracks.push({
		id: track_id,
		added_by_id: added_by_id
	});
	return this.save();
};


groupsSchema.methods.addComment = function(track_id, author_id, comment) {
	//todo return this.update()
};


mongoose.model("Groups", groupsSchema);

module.exports = mongoose.model("Groups");