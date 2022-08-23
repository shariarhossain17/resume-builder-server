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
    methods: ['GET', 'POST']
  },
});


let users = []

const addUser = (userId, socketId) => {
    !users.some((user) => user.userId === userId) &&
      users.push({ userId, socketId });
  };

  const getUser = (userId) => {
    return users.find(user => user.userId === userId)
  }

  const removeUser = (socketId) => {
    users = users.filter(user => user.socketId !== socketId)
  }
io.on("connection",(socket) => {
    console.log("on user connect");

    // connect
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        socket.emit("getUsers", users);
      });

      // send message
      socket.on('sendMessage',({senderId,receiverId,text}) =>{
        const user = getUser(receiverId,)
        io.to(user.socketId).emit("getMessage",{
          senderId,
          text
        })
      })

      // disconnect
      socket.on("disconnect",()=> {
        console.log("a user disconnect");
        removeUser(socket.id)
        socket.emit("getUsers", users);
      })
})
server.listen(8000,() => {
    console.log("socket running");
})



