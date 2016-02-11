var mongoose = require('mongoose');

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


// add a new group
groupsSchema.statics.add = function (name, description, added_by) {

	var myGroup = new this({
		name: name,
		description: description
	});
	myGroup.members.push({
		id: added_by
	});
	return myGroup.save();
};

groupsSchema.statics.findByIdAndAddTrack = function(group_id, track_id, added_by_id) {
	return Group.findByIdAndUpdate(
		group_id, {
			$push: {
				"tracks": {
					id: track_id,
					added_by_id: added_by_id
				}
			}
		}, {
			safe: true,
			upsert: true
		}
	);
};


mongoose.model("Groups", groupsSchema);

module.exports = mongoose.model("Groups");