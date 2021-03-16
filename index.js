const path = require("path");
const express = require('express');
const socketIO = require('socket.io');
const PORT = process.env.PORT || 3000;
const INDEX = 'pub/index.html';

const app = express();
const server = app.use(express.static(path.join(__dirname, "pub")))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, INDEX));
    // res.redirect("/"+randomString);
});

app.get("/:room", (req, res) => {
    res.sendFile(path.join(__dirname, INDEX));
});

var rooms = {};

io.on("connection", async (socket) => {
    socket.on("join", (id) => {
        if (!rooms[id]) {
            rooms[id] = {};
        };
        socket.room = id;
        socket.join(id);
        // io.to(id).emit("joined", "new one");
        // console.log("JOIN", id);
        let clients = io.sockets.adapter.rooms.get(id);
        let numClients = clients ? clients.size : 0;
        console.log("Socket", id, "has joined room", id+". It has", numClients, "clients");
    
        Object.keys(rooms[id]).forEach((key,index) => {
            socket.emit("sync", key, rooms[id][key])
        });
    });

    // socket.on('disconnect', () => {});

    socket.on("sync", (command, value) => {
        // console.log(socket.id, ">>>", command, value);
        socket.to(socket.room).emit("sync", command, value);
        try {
            rooms[socket.room][command] = value;
        } catch (error) {
            console.error(error)
        }
        
    });

    socket.on("print", value => {
        console.log(value);
    });
});

io.of("/").adapter.on("create-room", (room) => {
    console.log("New room", room, "was created.", Object.keys(rooms).length, "rooms totally");
});
  
io.of("/").adapter.on("join-room", (room, id) => {
    // if (!rooms[room]) {
    //     rooms[room] = {};
    // };
    // let clients = io.sockets.adapter.rooms.get(room);
    // let numClients = clients ? clients.size : 0;
    // console.log("Socket", id, "has joined room", room+". It has", numClients, "clients");
});

io.of("/").adapter.on("delete-room", (room) => {
    delete rooms[room];
    console.log("Room", room, "was deleted");
});
  
io.of("/").adapter.on("leave-room", (room, id) => {
    console.log("Socket", id, "has leaved room", room);
});


// Delete this?
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

  function randomString(stringLength = 6) {
    let chars = "0123456789abcdefghijklmnopqrstuvwzyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
    let randomString = "";
    for (let i=0; i<stringLength; i++) {
        let rNum = Math.floor(Math.random() * chars.length);
        randomString += chars.substring(rNum,rNum+1);
    }
    return randomString
}


