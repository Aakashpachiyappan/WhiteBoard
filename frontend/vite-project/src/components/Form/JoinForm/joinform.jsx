import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinForm = ({ uuid, socket, setUserId }) => {
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = (e) => {
    e.preventDefault();

    const roomData = {
      name,
      roomId,
      userId: uuid(), // Identify the joining user
      host: false,    // Joining users are not hosts
      presenter: false,
    };

    setUserId(roomData); // Save the user info in global state
    socket.emit('user-joined', roomData); // Tell the server we are joining
    navigate(`/${roomId}`); // Redirect to the whiteboard
    console.log('Joining room with data:', roomData); // Debug log
  };

  return (
    <form className="form col-md-12 mt-5" onSubmit={handleJoinRoom}>
      <div className="form-group">
        <input
          type="text"
          className="form-control my-2"
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          className="form-control my-2"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          required
        />
      </div>
      <button 
        className="mt-4 btn btn-primary btn-block form-control" 
        type="submit"
      >
        Join Room
      </button>
    </form>
  );
};

export default JoinForm;