import './App.css'
import Home from './pages/Dashboard'
import Room from './pages/Room.jsx/room'
import Login from './pages/Login'
import Register from './pages/Register'
import { Route, Routes, Navigate } from 'react-router-dom'
import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';


const server = 'http://localhost:5000';
const connectionOptions = {
  "force new connection": true,
  "reconnectionAttempts": "Infinity",
  "timeout": 10000,
  "transports": ["websocket"]
};

const socket = io(server, connectionOptions);

const App = () => {

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    socket.on('user-joined-success', (data) => {
      if (data.success) {
        console.log('User joined successfully');
      } else {
        console.log('Failed to join the room');
      }
    });

    return () => {
      socket.off('user-joined-success');
    }
  }, []);

  const uuid = () => {
    var S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
  }

  // Simple auth check
  const ProtectedRoute = ({ children }) => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <div className="container">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home uuid={uuid} socket={socket} setUserId={setUserId} />
          </ProtectedRoute>
        } />
        <Route path="/:roomId" element={
          <ProtectedRoute>
            <Room userId={userId} socket={socket} />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App;
