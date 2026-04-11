const express = require('express');
const app = express();
const server = require('http').createServer(app);
const {Server} = require('socket.io');

const io = new Server(server, {
    cors : {
        origin : 'http://localhost:5173',
        methods : ['GET', 'POST']
    }
});

app.get('/', (req, res) => {
    res.send('This is mern realtime whiteboard backend');
});

let roomIdGlobal,imgUrlGlobal;

io.on('connection', (socket) => {
    socket.on('user-joined', (data) => {
        const { roomId } = data;
        socket.join(roomId);
        socket.roomId = roomId; // Link room to socket

        socket.emit("user-joined-success", { success: true });

        // 2. Send the current image ONLY to the user who just joined
        if (imgUrlGlobal) {
            socket.emit("whiteboard-data-response", {
                imgUrl: imgUrlGlobal,
            });
        }
    });

    socket.on("whiteboard-data", (data) => {
        imgUrlGlobal = data;
        const roomId = socket.roomId;
        socket.broadcast.to(socket.roomId).emit("whiteboard-data-response", {
            imgUrl : data,
        });
});
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});