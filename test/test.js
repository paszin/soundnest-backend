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
			expect(response.result.groups[0].members[0]).to.have.property("id", 1);
			done();
		});
	});
});