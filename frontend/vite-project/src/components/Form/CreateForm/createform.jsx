 import React, { useState } from 'react';
 import { useNavigate } from 'react-router-dom';
 
 const CreateForm = ({ uuid , socket , setUserId }) => {

  const [roomId, setRoomId] = useState(uuid());
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleCreateRoom = (e) => {
    e.preventDefault();

    const roomData = {
      name,
      roomId,
      userId : uuid(),

      host : true,
      presenter : true,
    };
    setUserId(roomData);
    socket.emit('user-joined', roomData);

    navigate(`/${roomId}`);
    console.log('Creating room with data:', roomData); // Debug log
  }


  return (
    <form className="form col-md-12 mt-5">
      <div className="form-group">
        <input 
          type="text"
          className="form-control my-2"
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
         />
      </div>
      <div className="form-group border">
        <div className="input-group d-flex align-items-center justify-content-center">
          <input 
            type="text"
            value={roomId}
            className="form-control my-2"
            disabled
            placeholder="Generate Room Name"
           />
          <div className="input-group-append">
          <button className="btn btn-primary btn-sm me-1" onClick={() => setRoomId(uuid())} type="button">Generate</button>
          <button className="btn btn-outline-danger me-2 btn-sm" type="button" onClick={() => navigator.clipboard.writeText(roomId)}>Copy</button>
          </div>
        </div>
      </div>
      <button className="mt-4 btn btn-primary btn-block form-control" type="submit" onClick={handleCreateRoom}>Create Room</button>
    </form>
  );
}
export default CreateForm;