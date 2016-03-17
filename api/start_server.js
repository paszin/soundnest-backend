var server = require("./server.js")
var databse = "soundnest";
if (process.argv[2]) {
	databse += "-" + process.argv[2];
}

var user = process.env.SOUNDNEST_MONGO_USER;
var pass = process.env.SOUNDNEST_MONGO_PASSWORD;

server.startServer(databse, {user, pass});