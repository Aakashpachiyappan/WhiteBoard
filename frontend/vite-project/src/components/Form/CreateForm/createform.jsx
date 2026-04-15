import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateForm = ({ uuid, socket, setUserId }) => {
  const [roomId, setRoomId] = useState(uuid());
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();

    // Safely get user info from sessionStorage
    const savedUser = sessionStorage.getItem('user');
    const user = savedUser ? JSON.parse(savedUser) : { name: 'Unknown User' };

    const roomData = {
      name: user.name,
      roomId,
      userId: uuid(),
      host: true,
      presenter: true,
    };
    
    setUserId(roomData);
    socket.emit('user-joined', roomData);

    navigate(`/${roomId}`);
    console.log('Creating room with data:', roomData); 
  }

  return (
    <form className="form col-md-12 mt-4" onSubmit={handleCreateRoom}>
      <div className="form-group border rounded p-2 mb-4" style={{ borderColor: 'var(--glass-border) !important', background: 'rgba(0,0,0,0.02)' }}>
        <label className="text-muted d-block text-center mb-2" style={{ fontSize: '0.85rem' }}>Room ID</label>
        <div className="input-group d-flex justify-content-center align-items-center mb-2">
          <input 
            type="text"
            value={roomId}
            className="form-control text-center mx-2"
            disabled
            style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', fontWeight: '500', fontSize: '1.2rem'}}
           />
        </div>
        <div className="d-flex justify-content-center gap-2">
            <button className="btn btn-sm btn-outline-primary" onClick={() => setRoomId(uuid())} type="button">Generate New</button>
            <button className="btn btn-sm btn-outline-info" type="button" onClick={() => navigator.clipboard.writeText(roomId)}>Copy ID</button>
        </div>
      </div>
      <button className="premium-btn w-100 mt-2 py-3" type="submit" style={{ fontSize: '1.1rem' }}>Create New Board</button>
    </form>
  );
}

export default CreateForm;