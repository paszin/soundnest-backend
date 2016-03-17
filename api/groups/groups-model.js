var mongoose = require("mongoose");
var AutoIncrement = require("mongoose-sequence");
var _ = require("lodash");

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
			author_id: Number,
			added_at: {
				type: Date,
				default: Date.now
			}
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
	return myGroup.save();
};



groupsSchema.static.show = function(user_id) {
	return this.find({
		"members.id": user_id
	});
};


groupsSchema.methods.addTrack = function(track_id, added_by_id, comment) {
	var comments = [];
	if (comment) {
		comments = [{
			text: comment,
			author_id: added_by_id
		}];
	}
	this.tracks.push({
		id: track_id,
		added_by_id: added_by_id,
		comments: comments
	});
	return this.save();
};

groupsSchema.methods.addMember = function(user_id) {
	this.members.push({
		id: user_id
	});
	return this.save();
};

groupsSchema.methods.hasTrack = function(track_id) {
	//console.log(_.find(this.tracks, {id: track_id}));
	return this.tracks.length !== 0 && _.find(this.tracks, {id: track_id}).length !== 0;
};



mongoose.model("Groups", groupsSchema);

module.exports = mongoose.model("Groups");