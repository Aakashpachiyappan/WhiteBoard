import './form.css'
import CreateForm from './CreateForm/createform'
import JoinForm from './JoinForm/joinform'

const Form = ({ uuid, socket , setUserId }) => {
  return (
    <div className="row h-100 pt-5">
      <div className="form-box col-md-4 mt-5 border  p-5 border-primary rounded-2 mx-auto  d-flex flex-column align-items-center ">
        <h1 className='text-primary fw-bold'>Create Room</h1>
        <CreateForm uuid={uuid} socket={socket} setUserId={setUserId} />
      </div>
      <div className=" form-box col-md-4 mt-5 border  border-primary rounded-2 mx-auto p-5 d-flex flex-column align-items-center ">
        <h1 className='text-primary fw-bold'>Join Room</h1>
        <JoinForm uuid={uuid} socket={socket} setUserId={setUserId}  />
      </div>
    </div>
  );
}
export default Form;