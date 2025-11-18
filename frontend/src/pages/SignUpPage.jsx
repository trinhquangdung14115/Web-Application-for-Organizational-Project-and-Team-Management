import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/authService';
import tag from '../assets/images/logo.png';
import { Mail, Lock, User } from "lucide-react";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.firstName || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      const name = `${formData.firstName} ${formData.lastName}`.trim();
      await signup(name, formData.email, formData.password);
      // Đăng ký thành công, chuyển hướng về trang chủ
      navigate('/home');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.error?.message || 'Signup failed. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-background bg-center bg-cover min-h-screen flex items-center justify-center relative">
      <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center" 
           style={{
             WebkitBackdropFilter: "blur(30px) saturate(150%)",
             backdropFilter: "blur(30px) saturate(150%)",
           }}>
        
        <div className="w-full px-8 md:px-10">
          <h2 className="font-bold font-sans text-2xl text-gray-100 justify-center flex items-center space-x-2">
            <span>Welcome to </span><span className="text-brand">Syncora</span>
          </h2>
          <p className="text-gray-200 mt-4 mb-4 flex items-center justify-center text-center">
            Join thousands of teams already using Syncora to streamline their workflow
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none text-gray-800"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-medium bg-brand rounded-xl text-white py-2 hover:scale-105 duration-300 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : 'Create My Account'}
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
            <hr className="border-gray-400" />
            <p className="text-center text-sm">OR</p>
            <hr className="border-gray-400" />
          </div>

          <button className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 duration-300 text-black" disabled={isLoading}>
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.28-1.93-6.14-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.86 14.1c-.25-.75-.38-1.56-.38-2.4 0-.84.14-1.65.38-2.4V6.46H2.18C1.43 8.26 1 10.24 1 12.25s.43 4 1.18 5.79l3.68-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.96l3.68 2.84c.86-2.6 3.28-4.42 6.14-4.42z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>

          <p className="text-center text-white mt-6 text-sm">
            Already have an account?{" "}
            <a href="/login" className="text-brand font-medium hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
      
      <img src={tag} alt="logo" className="absolute top-1 right-1 w-40 h-auto" />
    </section>
  );
};

export default SignUpPage;