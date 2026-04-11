
import './App.css'
import Form from './components/Form/form'
import Room from './pages/Room.jsx/room'
import { Route , Routes } from 'react-router-dom'
import { io } from 'socket.io-client';
import { useState , useEffect} from 'react';


const server = 'http://localhost:5000';
const connectionOptions = {
  "force new connection" : true,
  "reconnectionAttempts": "Infinity",
  "timeout" : 10000,
  "transports" : ["websocket"]
};

const socket = io(server, connectionOptions);

const App = () => {

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    socket.on('user-joined-success', (data) => {
      if(data.success){
        console.log('User joined successfully');
      }else{
        console.log('Failed to join the room');
      }
    });
  }, []);

  const uuid = () =>{
    var S4 = () =>{
      return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
  }
  
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Form uuid={uuid} socket={socket} setUserId={setUserId}  />} />
        <Route path="/:roomId" element={<Room  userId={userId} socket={socket}/>} />
      </Routes>
    </div>
  )
}

export default App;
