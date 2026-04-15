import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            const data = await response.json();
            
            if (response.ok) {
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                navigate('/');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Server error during login. Please try again.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-container w-100" style={{ maxWidth: '400px' }}>
                <h2 className="text-center mb-4 text-gradient">Welcome Back</h2>
                {error && <div className="alert alert-danger" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label className="mb-2" style={{ color: 'var(--text-muted)' }}>Email address</label>
                        <input type="email" name="email" className="premium-input" placeholder="you@example.com" value={credentials.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-5">
                        <label className="mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
                        <input type="password" name="password" className="premium-input" placeholder="••••••••" value={credentials.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="premium-btn w-100">Sign In</button>
                </form>
                <p className="mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" className="modern-link">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
