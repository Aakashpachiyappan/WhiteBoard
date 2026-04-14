const express = require('express');
const app = express();
const server = require('http').createServer(app);
const {Server} = require('socket.io');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');

const io = new Server(server, {
    cors : {
        origin : '*',
        methods : ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://aakashaakash6842_db_user:Aakashkavi%40123@cluster0.surlrng.mongodb.net/?appName=Cluster0';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('Server is running');
});

// In-Memory Room State
const rooms = {};

io.on('connection', (socket) => {
    socket.on('user-joined', (data) => {
        const { roomId, userId, name, host } = data;
        
        if (!rooms[roomId]) {
            rooms[roomId] = { host: null, members: [], banned: [], elements: [] };
        }
        
        const room = rooms[roomId];
        
        // Ban Check
        if (room.banned.includes(userId)) {
            socket.emit("kicked");
            return;
        }

        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;

        if (host) {
            room.host = { socketId: socket.id, userId, name };
        }
        
        // Remove existing if rejoined
        room.members = room.members.filter(m => m.userId !== userId);
        
        room.members.push({ 
            socketId: socket.id, 
            userId, 
            name, 
            canEdit: host ? true : false 
        });

        socket.emit("user-joined-success", { success: true });
        
        // Sync full vector state to the new joiner
        socket.emit("whiteboard-data-response", room.elements);
        
        // Notify host
        if (room.host && room.host.socketId !== socket.id) {
            io.to(room.host.socketId).emit("update-members", room.members);
        } else if (room.host && room.host.socketId === socket.id) {
            io.to(room.host.socketId).emit("update-members", room.members);
        }
    });

    socket.on('approve-user', ({ roomId, targetUserId }) => {
        if (rooms[roomId]) {
            const member = rooms[roomId].members.find(m => m.userId === targetUserId);
            if (member) {
                member.canEdit = true;
                io.to(member.socketId).emit("approved-to-edit");
                io.to(rooms[roomId].host?.socketId).emit("update-members", rooms[roomId].members);
            }
        }
    });

    socket.on('kick-user', ({ roomId, targetUserId }) => {
        if (rooms[roomId]) {
            rooms[roomId].banned.push(targetUserId);
            const member = rooms[roomId].members.find(m => m.userId === targetUserId);
            if (member) {
                io.to(member.socketId).emit("kicked");
                rooms[roomId].members = rooms[roomId].members.filter(m => m.userId !== targetUserId);
                io.to(rooms[roomId].host?.socketId).emit("update-members", rooms[roomId].members);
            }
        }
    });

    socket.on("element-update", (element) => {
        const roomId = socket.roomId;
        if (!roomId || !rooms[roomId]) return;
        
        // Update or Push Element
        const existingIndex = rooms[roomId].elements.findIndex(e => e.id === element.id);
        if (existingIndex !== -1) {
            rooms[roomId].elements[existingIndex] = element;
        } else {
            rooms[roomId].elements.push(element);
        }
        
        socket.broadcast.to(roomId).emit("element-update", element);
    });

    socket.on("whiteboard-clear", () => {
        const roomId = socket.roomId;
        if(rooms[roomId]) {
            rooms[roomId].elements = [];
            io.to(roomId).emit("whiteboard-clear");
        }
    });

    socket.on("whiteboard-undo", (elements) => {
        const roomId = socket.roomId;
        if(rooms[roomId]) {
            rooms[roomId].elements = elements; // accept truth from whoever clicked undo
            io.to(roomId).emit("whiteboard-data-response", rooms[roomId].elements);
        }
    });

    socket.on('disconnect', () => {
        const roomId = socket.roomId;
        if (roomId && rooms[roomId]) {
            rooms[roomId].members = rooms[roomId].members.filter(m => m.socketId !== socket.id);
            if (rooms[roomId].host) {
                io.to(rooms[roomId].host.socketId).emit("update-members", rooms[roomId].members);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});