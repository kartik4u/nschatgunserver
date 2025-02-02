// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());

let users = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (room, username) => {
    socket.join(room);
    users[socket.id] = { username, room };
    io.to(room).emit("user-joined", `${username} joined the chat`);
  });

  socket.on("send-message", (messageData) => {
    const { room, message, sender } = messageData;
    io.to(room).emit("receive-message", { message, sender });
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit("user-left", `${user.username} left the chat`);
      delete users[socket.id];
    }
    console.log("User Disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
