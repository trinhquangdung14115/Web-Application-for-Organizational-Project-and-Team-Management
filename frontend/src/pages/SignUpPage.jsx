import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signup } from '../services/authService'; // Bỏ import login vì không dùng nữa
import { useAuth } from '../services/AuthContext';
import tag from '../assets/images/logo.png';
import { Mail, Lock } from "lucide-react"; // Bỏ import User icon nếu không dùng
import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle } from '../services/authService';

const API_BASE_URL = 'http://localhost:4000/api';

const SignUpPage = () => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation(); 
  const { saveLogin } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePostSignupRedirect = async (token) => {
    // 1. Xử lý Payment (Nếu user chọn gói Admin từ trang Pricing)
    if (location.state?.from === 'pricing' && location.state?.plan === 'Admin') {
        try {
            const response = await fetch(`${API_BASE_URL}/payment/session`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok && data.url) {
                window.location.href = data.url; 
                return;
            }
        } catch (error) { console.error("Payment error:", error); }
    }

    // 2. Xử lý Join Project
    // Nếu có invite code -> Backend đã tự add vào project -> Về Home
    if (location.state?.action === 'join' && location.state?.code) {
        navigate('/pending'); 
    } else {
        navigate('/home');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const data = await loginWithGoogle(credential); 
      saveLogin(data.user, data.token);
      await handlePostSignupRedirect(data.token);
    } catch (err) {
      setError("Google login failed.");
    }
  };
  const handleGoogleError = () => setError("Google login failed.");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.firstName || !formData.email || !formData.password) return setError('Please fill in all fields');
    if (formData.password.length < 6) return setError('Password min 6 chars');

    try {
      setIsLoading(true);
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      const inviteCode = location.state?.code || null;
      const plan = location.state?.plan || 'Free'; 
      const response = await signup(name, formData.email, formData.password, inviteCode, plan);
      
      // Backend trả về: { success: true, data: { token, user... } }
      // Service trả về: response.data
      const token = response.data?.token || response.token; 
      const user = response.data?.user || response.user;

      if (user && token) {
          saveLogin(user, token); // Lưu token nóng hổi vào Context
          await handlePostSignupRedirect(token); // Điều hướng ngay
      } else {
          // Trường hợp hy hữu không có token
          navigate('/login');
      }
      // ------------------------------------------------

    } catch (err) {
      console.error(err);
      setError(err.error?.message || err.message || 'Signup failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-background bg-center bg-cover min-h-screen flex items-center justify-center relative">
      <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center" style={{WebkitBackdropFilter: "blur(30px) saturate(150%)", backdropFilter: "blur(30px) saturate(150%)"}}>
        <div className="w-full px-8 md:px-10">
          <h2 className="font-bold font-sans text-2xl text-gray-100 justify-center flex items-center space-x-2"><span>Welcome to </span><span className="text-brand">Syncora</span></h2>
          <p className="text-gray-200 mt-4 mb-4 flex items-center justify-center text-center">Join thousands of teams already using Syncora</p>
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-200 mb-1">First Name</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800" disabled={isLoading}/></div>
              <div><label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800" disabled={isLoading}/></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-200 mb-1">Work Email</label><div className="relative"><Mail className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800" disabled={isLoading}/></div></div>
            <div><label className="block text-sm font-medium text-gray-200 mb-1">Password</label><div className="relative"><Lock className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800" disabled={isLoading}/></div></div>
            <button type="submit" className="w-full font-medium bg-brand rounded-xl text-white py-2 hover:scale-105 duration-300 flex items-center justify-center" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create My Account'}
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 items-center text-gray-400"><hr className="border-gray-400" /><p className="text-center text-sm">OR</p><hr className="border-gray-400" /></div>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} theme="outline" size="large" width="100%" />
          <p className="text-center text-white mt-6 text-sm">Already have an account? <a href="/login" className="text-brand font-medium hover:underline">Sign in</a></p>
        </div>
      </div>
      <img src={tag} alt="logo" className="absolute top-1 right-1 w-40 h-auto" />
    </section>
  );
};
export default SignUpPage;