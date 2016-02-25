var expect = require("chai").expect;
var server = require("../server.js")
server.startServer();

describe("A test suite", function() {
	beforeEach(function() {});
	afterEach(function() {});
	it("should work", function() {
		expect(true).to.be.true;
	});
});



describe('Health Check', function() {
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