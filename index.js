const express = require("express");

const app = express();

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

const PORT = process.env.PORT || 5000;

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);
  socket.on("join", ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    console.log(roomId);

    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    console.log(clients);

    clients.forEach(({ socketId }) => {
      // notify to all user that new user has joined
      io.to(socketId).emit("joined", {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on('code-change',({roomId,code})=>{
      socket.in(roomId).emit('code-change',{code});
  })
  socket.on('sync-code',({ socketId, code})=>{
    io.to(socketId).emit('code-change',{code});
})



  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit("disconnected", {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });
    delete userSocketMap[socket.id];
    socket.leave();
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
