import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateForm from '../components/Form/CreateForm/createform';
import JoinForm from '../components/Form/JoinForm/joinform';

const Dashboard = ({ uuid, socket, setUserId }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="text-center mt-5 auth-wrapper flex-column"><h2 className="text-gradient">Loading...</h2></div>;

  return (
    <div className="container py-5">
      {/* Top Navbar / User Profile */}
      <div className="d-flex justify-content-between align-items-center mb-5 p-4 glass-container" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="d-flex align-items-center gap-4">
          <div 
            className="rounded-circle d-flex justify-content-center align-items-center fw-bold text-white shadow-lg"
            style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', fontSize: '1.5rem'}}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: 'var(--text-main)' }}>{user.name}</h4>
            <small className="text-muted" style={{ fontSize: '1rem' }}>{user.email}</small>
          </div>
        </div>
        <button className="premium-btn-outline" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Dashboard Cards */}
      <div className="row g-5 justify-content-center">
        {/* Create Room Card */}
        <div className="col-md-6 col-lg-5">
          <div className="glass-container h-100 d-flex flex-column align-items-center position-relative overflow-hidden" style={{ padding: '3.5rem 2.5rem' }}>
            <div className="position-absolute top-0 start-0 w-100" style={{ height: '5px', background: 'var(--primary)' }}></div>
            <h2 className="fw-bold mb-3 mt-2" style={{ color: 'var(--text-main)' }}>Create Board</h2>
            <p className="text-center text-muted mb-4" style={{ fontSize: '1.1rem' }}>Start a new blank whiteboard and invite others to collaborate.</p>
            <div className="w-100 mt-auto">
              <CreateForm uuid={uuid} socket={socket} setUserId={setUserId} />
            </div>
          </div>
        </div>

        {/* Join Room Card */}
        <div className="col-md-6 col-lg-5">
          <div className="glass-container h-100 d-flex flex-column align-items-center position-relative overflow-hidden" style={{ padding: '3.5rem 2.5rem' }}>
            <div className="position-absolute top-0 start-0 w-100" style={{ height: '5px', background: 'var(--secondary)' }}></div>
            <h2 className="fw-bold mb-3 mt-2" style={{ color: 'var(--text-main)' }}>Join Board</h2>
            <p className="text-center text-muted mb-4" style={{ fontSize: '1.1rem' }}>Enter an existing room ID to collaborate with your team.</p>
            <div className="w-100 mt-auto">
              <JoinForm uuid={uuid} socket={socket} setUserId={setUserId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
