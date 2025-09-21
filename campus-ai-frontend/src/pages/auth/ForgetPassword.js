import React, { useState } from 'react';
import { Link } from 'react-router-dom';

let initialState = { email: "", password: "" };

export default function ForgetPassword() {
    const [state, setState] = useState(initialState);
    const [registers, setRegister] = useState(JSON.parse(localStorage.getItem('registers')) || []);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setState(s => ({ ...s, [e.target.name]: e.target.value }));
    };

    const handleSubmit = () => {
        const { email, password } = state;
        if (!email || !password) {
            setError("Please fill all fields");
            return;
        }
        
        let userIndex = registers.findIndex(register => register.email === email);
        
        if (userIndex === -1) {
            setError("Invalid email");
            return;
        }
        
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        registers[userIndex].password = password;
        setRegister(registers);
        localStorage.setItem('registers', JSON.stringify(registers));
        setSuccess("Password changed successfully");
        setState(initialState);
    };

    return (
        <div className='py-5'>
            <div className="container">
                {error && <p className='text-danger text-center'>{error}</p>}
                {success && <p className='text-success text-center'>{success}</p>}
                <h4 className='text-center'>Change Your Password</h4>
                <div className="card p-4 mx-auto" style={{ width: 320 }}>
                    <div className="row">
                        <div className="col-12 mb-3">
                            <label htmlFor="email" className='mb-2'>Email</label>
                            <input 
                                type="email" 
                                name='email' 
                                className='form-control' 
                                id='email' 
                                value={state.email} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="col mb-3">
                            <label htmlFor="password" className='mb-2'>New Password</label>
                            <input 
                                type="password" 
                                name='password' 
                                className='form-control' 
                                id='password' 
                                value={state.password} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="col-12 mb-3">
                            <button className='btn btn-primary w-100' onClick={handleSubmit}>Change Password</button>
                        </div>
                        <p className='text-center'>
                            <Link to="/">Back to Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
