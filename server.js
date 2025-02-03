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
let usernames = [];
let boxes = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (room, username,initialData) => {
    socket.join(room);
    users[socket.id] = { username, room };

    usernames.push(username);
    console.log("room",room);
    boxes[room] = boxes[room]?boxes[room]:[];
    boxes[room].push(initialData);

    //boxes[room][username]=initialData;
    //.push(initialData);
    // let enData = {allData:boxes[room]}
    //boxes.push(initialData);
    console.log("boxes",boxes);
    io.to(room).emit("user-joined", `${username} joined the chat`,usernames,boxes[room]);
  });

  socket.on("send-message", (messageData) => {
    const { room, message, sender } = messageData;
    io.to(room).emit("receive-message", { message, sender });
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {



      let id = usernames.indexOf(user.username);
      usernames.splice(id,1);

      let idBox = boxes[user.room].findIndex((v,i)=>v.username==user.username);
      boxes[user.room].splice(idBox,1);

      io.to(user.room).emit("user-left", `${user.username} left the chat`,user,usernames,boxes[user.room]);
      delete users[socket.id];



      //delete users[socket.id];
    }
    console.log("User Disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
