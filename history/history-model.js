var mongoose = require("mongoose");

var historySchema = new mongoose.Schema({
	user_id: Number,
	track_id: Number,
	timestamp: {
		type: Date,
		default: Date.now
	},
	comment_count: Number,
	playback_count: Number,
	favoritings_count: Number,
	play_status: Number //0 for not played (just collecting data) 1 for played completly
});


// add a track to history
historySchema.statics.add = function(user_id, track_id, statistics, play_status) {
	//play_status: 0 for not played (just collecting data) 1 for played completly
	var record = new this({
		user_id: user_id,
		track_id: track_id,
		comment_count: statistics.comment_count,
		playback_count: statistics.playback_count,
		favoritings_count: statistics.favoritings_count,
		play_status: play_status
	});
	return record.save();
};


mongoose.model("History", historySchema);

module.exports = mongoose.model("History");
