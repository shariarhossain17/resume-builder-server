const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const cors = require("cors");
const PORT = process.env.PORT || 8800;

const io = new Server(server, {
  cors: {
    origin: "https://resume-builder-f6311.web.app/",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

let activeUsers = [];

io.on("connection", (socket) => {
  // add new User
  socket.on("new-user-add", (newUserId) => {
    // if user is not added previously
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
      console.log("New User Connected", activeUsers);
    }
    // send all active users to new user
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    // remove user from active users
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", activeUsers);
    // send all active users to all users
    io.emit("get-users", activeUsers);
  });

  // send message to a specific user
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    // console.log("Sending from socket to :", receiverId)
    // console.log("Data: ", data)
    if (user) {
      console.log("outsise", data);
      socket.broadcast.emit("recived-message", data);
      // socket.to(user.socketId).emit("recieve-message", data);
    }
  });
});

server.listen(PORT, () => {
  console.log("SERVER IS RUNNING");
});
