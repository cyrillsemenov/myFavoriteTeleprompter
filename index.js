// const fs = require("fs");
// const options = {
//     key: fs.readFileSync("key.pem"),
//     cert: fs.readFileSync("cert.pem")
// };
const express = require("express");
const app = express();
const path = require("path");
const http = require("https").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "pub")))

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "pub/index.html"));
});

app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, "pub/index.html"));
});

io.on("connection", (socket) => {

    socket.on("join", (id) => {
        socket.room = id;
        socket.join(id);
        socket.broadcast.to(id).emit("joined", id);
    });

    socket.on("sync", (command, value) => {
        // console.log("MESSAGEFROM", socket.id);
        socket.broadcast.emit("sync", command, value);
    });
    socket.on("print", value => {
        console.log(value);
    });
});

http.listen(port, () => {
    console.log("Server listening at port %d", port);
});

http.on('clientError', (err, socket) => {
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

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