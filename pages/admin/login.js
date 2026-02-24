import React, { useState } from 'react';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRateLimited, setIsRateLimited] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (isRateLimited) {
            setError('Too many login attempts. Please try again later.');
            return;
        }

        try {
            const response = await axios.post('/api/login', { email, password });
            if (response.data.success) {
                // Handle successful login
            } else {
                setError('Invalid email or password.');
                setIsRateLimited(true);
                setTimeout(() => setIsRateLimited(false), 30000); // 30 seconds rate limit
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        }
    };

    return (
        <div className="login-container">
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p>{error}</p>}
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;