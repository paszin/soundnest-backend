/*global describe, it, before, after*/
var expect = require("chai").expect;
var server = require("../api/server.js");
server.startServer("soundnest-test");
var Groups = require("../api/groups/groups-model.js");
var Invitations = require("../api/invitations/invitations-model.js");
var History = require("../api/history/history-model.js");
var helpers = require("./helpers.js");


describe("create groups", function() {
	var options = {};
	options.url = "/groups";

	before(function(done) {
		Groups.remove(function() {}).then(() => done());
	});

	it("should create a new group", function(done) {
		options.method = "POST";
		options.payload = {
			name: "My Group",
			description: "test description",
			user_id: 1
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			done();
		});
	});

	it("should get the new group", function(done) {
		options.method = "GET";
		options.url += "?user_id=1";

		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(200);
			expect(response.result).to.have.property("groups").with.length(1);
			expect(response.result.groups).to.be.a("array");
			expect(response.result.groups[0].name).to.equal("My Group");
			expect(response.result.groups[0].description).to.equal("test description");
			expect(response.result.groups[0].members).to.be.a("array").with.length(1);
			expect(response.result.groups[0].members[0]).to.have.property("id");
			done();
		});
	});
});



describe("Invitation", function() {
	var options = {};
	options.url = "/invitations";
	var newgroup = {};

	before(function(done) {
		Invitations.remove(function() {});
		Groups.remove(function() {});
		Groups.add("Group 1", "describe this group", 100).then(function(group) {
			newgroup.id = group.id;
			done();
		});
	});

	it("should add a new invitation", function(done) {
		options.method = "POST";
		options.payload = {
			code: "code123",
			message: "welcome to group 1",
			username: "User1",
			group_id: newgroup.id
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			expect(response.result).to.be.null;
			done();
		});
	});

	it("should appear in the database", function(done) {
		Invitations.find({}).then(function(invitations) {
			expect(invitations).to.be.a("array").with.length(1);
			expect(invitations[0]).to.have.property("code", "code123");
			expect(invitations[0]).to.have.property("added_by_name", "User1");
			expect(invitations[0]).to.have.property("message", "welcome to group 1");
			expect(invitations[0]).to.have.property("group_id");
			done();
		});
	});

	it("should accept the invitation", function(done) {
		options.method = "GET";
		options.url += "?code=code123&user_id=200";
		options.payload = null;
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			expect(response.result).to.have.property("group");
			done();
		});
	});

	it("sould be member of the new group", function(done) {
		Groups.find({
			"members.id": 200
		}).then(function(groups) {
			expect(groups).to.be.a("array").with.length(1);
			expect(groups[0]).to.have.property("id", newgroup.id);
			done();
		});
	});
});


describe("Tracks in History", function() {

	before(function(done) {
		History.remove({}).then(function() {
			done();
		});
	});

	after(function(done) {
		History.remove({}).then(function() {
			done();
		});
	});


	var options = {};
	options.url = "/history";

	it("should add a track to the History", function(done) {
		options.method = "POST";
		options.payload = {
			user_id: 100,
			track_id: 1001,
			statistics: {
				comment_count: 400,
				playback_count: 40,
				favoritings_count: 4,
				play_status: 4000
			}
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			done();
		});
	});

	it("should return all tracks in the history", function(done) {
		options.method = "GET";
		options.payload = null;
		options.url += "?user_id=100";
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(200);
			expect(response.result).to.have.property("tracks").with.length(1);
			expect(response.result.tracks).to.be.a("array");
			expect(response.result.tracks[0]).to.have.property("sn");
			expect(response.result.tracks[0].sn.track_id).to.equal(1001);
			//pagination
			expect(response.result.total).to.equal(1);
			done();
		});
	});
});


describe("Many Tracks in History", function() {
	before(function(done) {
		var docs = [],
			currentTimestamp = Date.now(),
			user_id, track_id;
		for (user_id = 1; user_id <= 2; user_id += 1) {
			for (track_id = 1001; track_id <= 1090; track_id += 1) {
				currentTimestamp += 100;
				docs.push({
					user_id: user_id,
					track_id: 202258750,
					timestamp: currentTimestamp,
					comment_count: 4,
					playback_count: 4000,
					favoritings_count: 40,
					play_status: 1
				});
			}
		}
		History.remove({}).then(function() {
			History.collection.insert(docs, function() {
				History.find({}).then(
					function() {
						done();
					});
			});
		});
	});

	it("should return the latest 20 tracks from the history", function(done) {
		var options = {};
		options.url = "/history?user_id=1";
		options.method = "GET";
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(200);
			expect(response.result).to.have.property("tracks").with.length(20);
			expect(response.result.total).to.equal(90);
			done();
		});
	});
});



describe("Tracks in Groups", function() {
	var options = {},
		newgroup = {};

	before(function(done) {
		Groups.remove({});
		Groups.remove(function() {});
		Groups.add("Group 1", "describe this group", 100)
			.then(function(group) {
				newgroup.id = group.id;
				done();
			});
	});

	it("should add a track", function(done) {
		options.url = "/groups/" + newgroup.id + "/tracks";
		options.method = "POST";
		options.payload = {
			track_id: 162069768,
			user_id: 100,
			comment: "so cool"
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			done();
		});
	});

	it("should not add the same track again", function(done) {
		options.url = "/groups/" + newgroup.id + "/tracks";
		options.method = "POST";
		options.payload = {
			track_id: 162069768,
			user_id: 100,
			comment: "so cool2"
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(204);
			done();
		});
	});

	it("should add another track", function(done) {
		options.url = "/groups/" + newgroup.id + "/tracks";
		options.method = "POST";
		options.payload = {
			track_id: 202258750,
			user_id: 100,
			comment: "so cool, too"
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			done();
		});
	});

	it("should get the tracks", function(done) {
		options.method = "GET";
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(200);
			expect(response.result).to.have.property("tracks").with.length(2);
			expect(response.result.tracks).to.be.an("array");
			expect(response.result.tracks[0]).to.have.property("sn");
			expect(response.result.tracks[0].sn.id).to.equal(162069768);
			expect(response.result.tracks[1].sn.id).to.equal(202258750);
			expect(response.result.tracks[0].sn.added_by_id).to.equal(100);
			expect(response.result.tracks[0].sn.comments).to.be.a("array").with.length(1);
			expect(response.result.tracks[0].sn.comments[0]).to.have.property("text", "so cool");
			expect(response.result.tracks[0].sn.comments[0]).to.have.property("author_id", 100);
			done();
		});
	});


	it("should delete the track", function(done) {
		options.method = "DELETE";
		options.url += "/1001"; //delete track 1001
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(204);
			done();
		});
	});

	it("should be deleted from the group", function(done) {
		Groups.find({
			id: newgroup.id
		}).then(
			function(groups) {
				expect(groups[0].tracks).to.be.an("array").with.length(0);
				done();
			});
	});
});


describe("Comments for Tracks", function() {

	var options = {},
		newgroup = {};

	before(function(done) {
		Groups.remove({}, function() {})
			.then(() => Groups.add("Group 1", "describe this group", 100)) //add group
		.then(function(group) {
			newgroup.id = group.id;
			return group;
		})
			.then((group) => group.addTrack(1001, 100, "so cool1")) //add track
		.then(function() {
			done();
		});
	});


	it("should add a comment to a track", function(done) {
		options.url = "/groups/" + newgroup.id + "/tracks/" + 1001 + "/comments";
		options.method = "POST";
		options.payload = {
			user_id: 100,
			text: "so cool2"
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			done();
		});
	});

	it("should appear in the database", function(done) {
		Groups.find({
			id: newgroup.id
		}).then(function(groups) {
			expect(groups[0].tracks[0].comments).to.be.an("array").with.length(2);
			expect(groups[0].tracks[0].comments[0]).to.have.property("text", "so cool1");
			expect(groups[0].tracks[0].comments[1]).to.have.property("text", "so cool2");
			done();
		});
	});
});


describe("Members in Group", function() {
	var options = {},
	    newgroup = {};
	before(function(done) {
		//create a group
		newgroup = {};
		helpers.createGroup({added_by: 1}, function(data) {
			newgroup.id = data.id;
			done();
		});
	});

/*	it("should add a member", function(done) {
		options.method = "POST";
		options.url = helpers.buildPath("groups", newgroup.id, "members");
		options.payload = {
			user_id: 100
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(201);
			Groups.findOne({
				id: newgroup.id
			}).then(
				function(group) {
					expect(group.members).to.be.an("array").with.length(1);
					//expect(groups[0].members[1]).to.have.property("id", 100);
					done();
				}
			);
		});
	});
*/

	it("should delete a member", function(done) {
		options.method = "DELETE";
		options.url = helpers.buildPath("groups", newgroup.id, "members", 1);
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(204);
			Groups.findOne({
				id: newgroup.id
			}).then(
				function(group) {
					expect(group.members).to.be.an("array").with.length(0);
					done();
				}
			);
		});

	});
});