const socketIO = require('socket.io');

module.exports = function setupSocketServer(server, app) {
    const io = socketIO().attach(server, {
        cors: {
            origin: ["http://localhost:5173"],
        }
    });

    app.io = io;
    global.io = io;
    
    require("../sockets/user.socket")(io);
};