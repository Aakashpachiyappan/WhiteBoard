import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://whiteboard-ppc9.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            
            if (response.ok) {
                navigate('/login');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Server error during registration. Please try again.');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="glass-container w-100" style={{ maxWidth: '450px' }}>
                <h2 className="text-center mb-4 text-gradient">Create Account</h2>
                {error && <div className="alert alert-danger" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-3">
                        <label className="mb-2" style={{ color: 'var(--text-muted)' }}>Name</label>
                        <input type="text" name="name" className="premium-input" placeholder="Your Name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-3">
                        <label className="mb-2" style={{ color: 'var(--text-muted)' }}>Email address</label>
                        <input type="email" name="email" className="premium-input" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="form-group mb-5">
                        <label className="mb-2" style={{ color: 'var(--text-muted)' }}>Password</label>
                        <input type="password" name="password" className="premium-input" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="premium-btn w-100">Sign Up</button>
                </form>
                <p className="mt-4 text-center" style={{ color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" className="modern-link">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
