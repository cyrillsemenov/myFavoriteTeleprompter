const path = require("path");
const express = require('express');
const socketIO = require('socket.io');
const PORT = process.env.PORT || 3000;
const INDEX = 'pub/index.html';

const app = express();
const server = app.use(express.static(path.join(__dirname, "pub")))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

// const express = require("express");
// const app = express();
// const path = require("path");
// const http = require("http").createServer(app);
// const io = require("socket.io")(http);
// const port = process.env.PORT || 3000;

// app.use(express.static(path.join(__dirname, "pub")))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, INDEX));
});

app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, INDEX));
});

io.on("connection", (socket) => {

    socket.on("join", (id) => {
        socket.room = id;
        socket.join(id);
        socket.to(id).emit("joined", id);
    });

    socket.on("sync", (command, value) => {
        // console.log("MESSAGEFROM", socket.id);
        // console.log(socket.id, ">>>", command, value);
        socket.to(socket.room).emit("sync", command, value);
    });

    socket.on("print", value => {
        console.log(value);
    });
});

// http.listen(port, () => {
//     console.log("Server listening at port %d", port);
// });

// http.on('clientError', (err, socket) => {
//     console.error(err);
//     socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
//   });

const throttle = (func, limit = process.env.LIMIT || 30) => {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }