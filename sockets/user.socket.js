const { UserConnectionModel } = require("../models/userConnection.model");


module.exports = function handler(io) {
  io.on("connection", (socket) => {
    console.log('A user connected');

    // Join user in socket
    socket.on('join', async (userId) => {
      socket.join(userId);
      await UserConnectionModel.findOneAndUpdate(
        { userId },
        { userId, socketId: socket.id },
        { upsert: true }
      );
    });

    // Remove the disconnected user
    socket.on('disconnect', async () => {
      const result = await UserConnectionModel.deleteOne({ socketId: socket.id })
      if (result.deletedCount > 0) {
        console.log(`User ${socket.id} disconnected`);
      }
    });

  });
};
