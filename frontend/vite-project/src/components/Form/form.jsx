import './form.css'
import CreateForm from './CreateForm/createform'
import JoinForm from './JoinForm/joinform'

const Form = ({ uuid, socket , setUserId }) => {
  return (
    <div className="container d-flex flex-column flex-md-row justify-content-center align-items-center gap-5 pt-5" style={{ minHeight: '80vh' }}>
      <div className="form-box p-5 d-flex flex-column align-items-center w-100" style={{ maxWidth: '400px' }}>
        <h1>Create Room</h1>
        <CreateForm uuid={uuid} socket={socket} setUserId={setUserId} />
      </div>
      <div className="form-box p-5 d-flex flex-column align-items-center w-100" style={{ maxWidth: '400px' }}>
        <h1>Join Room</h1>
        <JoinForm uuid={uuid} socket={socket} setUserId={setUserId}  />
      </div>
    </div>
  );
}
export default Form;