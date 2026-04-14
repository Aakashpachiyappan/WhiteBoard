import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinForm = ({ uuid, socket, setUserId }) => {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();

    // Safely get user info from localStorage
    const savedUser = localStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : { name: 'Unknown User' };

    const roomData = {
      name: user.name,
      roomId,
      userId: uuid(),
      host: false,
      presenter: false,
    };

    setUserId(roomData);
    socket.emit('user-joined', roomData);
    navigate(`/${roomId}`);
    console.log('Joining room with data:', roomData);
  };

  return (
    <form className="form col-md-12 mt-4" onSubmit={handleJoinRoom}>
      <div className="form-group mb-4">
        <label className="text-muted d-block text-center mb-2" style={{ fontSize: '0.85rem' }}>Enter Room ID to connect</label>
        <input
          type="text"
          className="premium-input text-center py-3"
          placeholder="e.g. 1a2b-3c4d-5e6f"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
          style={{ fontSize: '1.2rem', letterSpacing: '2px' }}
        />
      </div>
      <button 
        className="premium-btn w-100 mt-2 py-3" 
        type="submit"
        style={{ fontSize: '1.1rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
      >
        Join Board
      </button>
    </form>
  );
};

export default JoinForm;