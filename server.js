var mongoose = require("mongoose");
var db;



const Hapi = require("hapi");

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({
	host: "0.0.0.0",
	port: 8000,
	routes: {
		cors: true
	}
});



function startServer(database, options) {

	mongoose.connect("mongodb://localhost/" + database); //, options);
	db = mongoose.connection;

	db.on("error", console.error.bind(console, "connection error:"));

	server.register([
		require("./groups/groups-routes"),
		require("./invitations/invitations-routes"),
		require("./history/history-routes")
	], (err) => {

		if (err) {
			throw err;
		}

		// Start the server
		server.start((err) => {
			console.log("Server running at:", server.info.uri);
		});

	});
}


module.exports = {
	server,
	startServer,
	db
};