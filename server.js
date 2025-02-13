// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

const io = new Server(server, {
  transports: ['websocket'],
  reconnect: true,            // Enable automatic reconnections
  reconnectionAttempts: 5,    // Limit the number of reconnection attempts
  reconnectionDelay: 1000,    // Delay in ms between reconnections
  reconnectionDelayMax: 5000, // Max delay in ms between reconnections
  timeout: 10000,             // Timeout to wait before failing connection

  //wsEngine: 'ws', // Set 'ws' as the WebSocket engine (default engine)
  cors: {
    origin: "*"  // Allow cross-origin requests from all origins
  }
});

app.use(cors());

let users = {};
let usernames = [];
let boxes = {};
let mesges = {};

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("join-room", (room, username,initialData) => {
    socket.join(room);
    users[socket.id] = { username, room };

    usernames.push(username);
    mesges[room]= mesges[room]?mesges[room]:[];
    console.log("mesges[room]----",mesges[room]);

    // boxes[room] = boxes[room]?boxes[room]:[];
    // boxes[room].push(initialData);


    if(room in boxes){
      let ii = boxes[room].findIndex((v)=>v.username==initialData.username)
      console.log("ii",ii); 
      if(ii<0){
        boxes[room].push(initialData)
       }
     } else{
      boxes[room]=[];
      boxes[room].push(initialData)
     }



   // io.to(room).emit("receive-message", mesges[room]);
    //boxes[room][username]=initialData;
    //.push(initialData);
    // let enData = {allData:boxes[room]}
    //boxes.push(initialData);
    console.log("boxes-------",boxes);
    io.to(room).emit("user-joined", `${username} joined the chat`,usernames,boxes[room],mesges[room]);
    io.emit("onlineUsers", boxes);
  });

  socket.on("send-message", (messageData) => {
    const { room, message, sender } = messageData;
    mesges[room]?mesges[room].push(messageData):mesges[room]=[];
    
    console.log("mesges[room]1",mesges[room]);
    io.to(room).emit("receive-message", mesges[room]);
  });

  socket.on("change-room", () => {
      const user = users[socket.id];
      console.log("user",user);
      if (user) {

      let id = usernames.indexOf(user.username);
      usernames.splice(id,1);

      let idBox = boxes[user.room].findIndex((v,i)=>v.username==user.username);
      boxes[user.room].splice(idBox,1);

      io.to(user.room).emit("user-left", `${user.username} left the chat`,user,usernames,boxes[user.room]);
      delete users[socket.id];
      io.emit("onlineUsers", boxes);
      }

  });

  socket.on("updateNewMsg", (messageData) => {
    io.emit("newMsg", messageData);
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

      io.emit("onlineUsers", boxes);


      //delete users[socket.id];
    }
    console.log("User Disconnected:", socket.id);
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
