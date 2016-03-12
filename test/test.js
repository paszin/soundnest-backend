/*global describe, it*/
var expect = require("chai").expect;
var server = require("../server.js");
server.startServer("soundnest-test");

describe("A test suite", function() {
	beforeEach(function() {});
	afterEach(function() {});
	it("should work", function() {
		expect(true).to.be.true;
		expect(100).to.equal(100);
	});
});


describe("Basics", function() {
	it("responds with status code 200 and hello world text", function(done) {
		var options = {
			method: "GET",
			url: "/"
		};
		server.server.inject(options, function(response) {
			expect(response.statusCode).to.equal(200);
			expect(response.result).to.equal('hello world');
			done();
		});
	});
});


describe("create groups", function() {
	var options = {};
	options.url = "/groups";

	before(function() {
		server.Groups.remove(function() {});
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
		server.Invitations.remove(function() {});
		server.Groups.remove(function() {});
		server.Groups.add("Group 1", "describe this group", 100).then(function(group) {
			newgroup.id = group.id;
			done();
		});
	});

	it("should add a new invitation", function(done) {
		console.log("new group in test 1", newgroup);
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
		server.Invitations.find({}).then(function(invitations) {
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



});