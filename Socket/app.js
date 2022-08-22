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

io.on("connection",(socket) => {
    console.log("on user connect");
    socket.emit("myevent","welcome to socket")
})
server.listen(8000,() => {
    console.log("socket running");
})



