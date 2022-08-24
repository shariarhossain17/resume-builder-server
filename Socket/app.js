const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials:true
  },
});

global.onlineUsers = new Map()

io.on("connection",(socket)=> {
  global.chatSocket = socket;
  socket.on("add-user",(userId)=> {
    onlineUsers.set(userId,socket.id)
  });

  socket.on("send-msg",(data)=> {
    const sendUserSocket = onlineUsers.get(data.to)
    if(sendUserSocket){
      socket.to(sendUserSocket).emit("msg-recieve",data.msg)
    }
  })
})

server.listen(8000, () => {
  console.log("socket running");
});
