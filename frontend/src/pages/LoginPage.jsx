import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../services/authService';
import tag from '../assets/images/logo.png';
import { useAuth } from '../services/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { loginWithGoogle, requestPasswordReset, resetPassword } from '../services/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { saveLogin } = useAuth();
  const [view, setView] = useState('login');
  const [confirmPassword, setConfirmPassword] = useState(''); // Cho form Reset
  const [resetToken, setResetToken] = useState(null); // Lưu token từ URL
  const [successMessage, setSuccessMessage] = useState('');
  const location = useLocation(); // Hook để lấy query params

  useEffect(() => {
    // Khi component LoginPage hiện lên, xóa ngay lập tức token cũ
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Check URL params for Reset Token (Flow: Email link -> Login Page?token=xyz)
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');
    
    if (token) {
        setResetToken(token);
        setView('reset');
        setError('');
        setSuccessMessage('');
    }
  }, [location]);
  //GG trả về
  const handleGoogleSuccess = async (credentialResponse) => {
  try {
    const { credential } = credentialResponse;
    // Gọi hàm service (đã thống nhất) để gửi token lên BE
    const data = await loginWithGoogle(credential); 
    const {token, user} = data.data || data;
    
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    saveLogin(user, token);

    if(!user.currentOrganizationId){
        console.log("User has no organization. Redirecting to Pricing!")
        navigate('/pricing')
    }
    else{
        navigate('/home'); 
    }
 
    
  } catch (err) {
    console.error("Google login failed", err);
    setError("Google login failed. Please try again.");
  }
};



const handleGoogleError = () => {
  console.error('Google Login Failed');
  setError("Google login failed.");
};
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
    setIsLoading(true);
    const res = await apiLogin(email, password);
    console.log("Response:", res);   
    
    const user = res.data?.user || res.user; 
    const token = res.data?.token || res.token;

    if (!user || !user.role) {
        throw new Error("DUser data missing!");
    }
    saveLogin(user, token);

    if (!user.currentOrganizationId) {
            console.log("Old user but no Organization. Redirecting to Pricing...");
            navigate('/pricing'); 
            return; 
        }

    const roleCheck = user.role.toLowerCase(); 

    if (roleCheck === 'admin') {
        navigate('/admin/home');
    } else {
        navigate('/home');
    }

} catch (err) {
    console.error("Login Error:", err);
    // Hiển thị lỗi ra UI để biết đường sửa
    setError(err.message || err.response?.data?.message || "Login failed");
} finally {
    setIsLoading(false);
}
  };

  // 3. Xử lý Submit Forgot Password (Gửi Email)
  const handleForgotSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');

      if (!email) {
          setError('Please enter your email address');
          return;
      }

      try {
          setIsLoading(true);
          await requestPasswordReset(email);
          setSuccessMessage('Reset link has been sent to your email. Please check it.');
      } catch (err) {
          setError(err.response?.data?.message || "Failed to send reset link");
      } finally {
          setIsLoading(false);
      }
  };

  // 4. Xử lý Submit Reset Password (Đổi pass mới)
  const handleResetSubmit = async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');

      if (!password || !confirmPassword) {
          setError('Please fill in all fields');
          return;
      }

      if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
      }

      try {
          setIsLoading(true);
          await resetPassword(resetToken, password);
          setSuccessMessage('Password reset successfully! Redirecting to login...');
          
          // Chuyển về trang login sau 2 giây
          setTimeout(() => {
              setView('login');
              setSuccessMessage('');
              setPassword('');
              setConfirmPassword('');
              // Xóa token trên URL để sạch đẹp
              navigate('/login', { replace: true }); 
          }, 2000);

      } catch (err) {
          setError(err.response?.data?.message || "Failed to reset password. Token might be expired.");
      } finally {
          setIsLoading(false);
      }
  };

  // Helper để render Title dựa trên View
  const renderTitle = () => {
      if (view === 'forgot') return { title: 'Forgot Password', subtitle: 'Enter your email to receive a reset link' };
      if (view === 'reset') return { title: 'Reset Password', subtitle: 'Enter your new password' };
      return { title: 'Welcome Back', subtitle: 'Sign in to continue your work' };
  };

  const { title, subtitle } = renderTitle();

  return (
    <section className="bg-background2 bg-center bg-cover min-h-screen flex items-center justify-end pr-32 relative text-white">
      {/* QUOTE SECTION */}
      <div className="absolute left-20 max-w-xl">
        <h1 className="text-6xl font-bold leading-tight drop-shadow-lg">
          "The best way to predict the future is to create it."
        </h1>
        <p className="mt-6 text-lg text-gray-200 italic drop-shadow-md">
          — Tom Ca Chua - 2025
        </p>
      </div>

      {/* MAIN CARD */}
      <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center" 
           style={{
             WebkitBackdropFilter: "blur(30px) saturate(150%)",
             backdropFilter: "blur(30px) saturate(150%)",
           }}>
        
        <div className="w-full px-8 md:px-10">
          <h2 className="font-bold font-sans text-2xl text-gray-600 justify-center flex items-center">
            {title}
          </h2>
          <p className="text-gray-500 mt-4 mb-4 flex items-center justify-center text-center">
            {subtitle}
          </p>

          {/* Error & Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm text-center">
              {successMessage}
            </div>
          )}

          {/* --- VIEW: LOGIN --- */}
          {view === 'login' && (
            <>
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                    <div>
                    <label className="block text-gray-200 text-sm mb-1">Email address</label>
                    <input
                        className="p-3 rounded-xl border w-full text-gray-800"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your Email"
                        disabled={isLoading}
                    />
                    </div>
                    
                    <div className="relative">
                    <label className="block text-gray-200 text-sm mb-1">Password</label>
                    <input
                        className="p-3 rounded-xl border w-full text-gray-800"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your Password"
                        disabled={isLoading}
                    />
                    </div>
                    
                    <div className="text-right">
                    <button 
                        type="button" 
                        onClick={() => { setView('forgot'); setError(''); setSuccessMessage(''); }}
                        className="text-sm text-[#f35640] hover:underline"
                    >
                        Forgot Password?
                    </button>
                    </div>
                    
                    <button
                    type="submit"
                    className="bg-[#f35640] rounded-xl font-medium text-white py-3 hover:scale-105 duration-300 flex items-center justify-center"
                    disabled={isLoading}
                    >
                    {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
                    <hr className="border-gray-400" />
                    <p className="text-center text-sm">OR</p>
                    <hr className="border-gray-400" />
                </div>

                <div className="mt-4">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        width="100%"
                    />
                </div>

                <p className="text-center text-white mt-6 text-sm">
                    Don't have an account?{" "}
                    <a href="/signup" className="text-[#f35640] font-medium hover:underline">
                    Sign Up
                    </a>
                </p>
            </>
          )}

          {/* --- VIEW: FORGOT PASSWORD --- */}
          {view === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
                  <div>
                      <label className="block text-gray-200 text-sm mb-1">Email address</label>
                      <input
                          className="p-3 rounded-xl border w-full text-gray-800"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email to find account"
                          disabled={isLoading}
                      />
                  </div>

                  <button
                      type="submit"
                      className="bg-[#f35640] mt-2 rounded-xl font-medium text-white py-3 hover:scale-105 duration-300 flex items-center justify-center"
                      disabled={isLoading}
                  >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <button 
                      type="button"
                      onClick={() => { setView('login'); setError(''); setSuccessMessage(''); }}
                      className="text-white text-sm hover:underline text-center mt-2"
                  >
                      Back to Login
                  </button>
              </form>
          )}

          {/* --- VIEW: RESET PASSWORD (TOKEN) --- */}
          {view === 'reset' && (
              <form onSubmit={handleResetSubmit} className="flex flex-col gap-4">
                  <div>
                      <label className="block text-gray-200 text-sm mb-1">New Password</label>
                      <input
                          className="p-3 rounded-xl border w-full text-gray-800"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password"
                          disabled={isLoading}
                      />
                  </div>

                  <div>
                      <label className="block text-gray-200 text-sm mb-1">Confirm Password</label>
                      <input
                          className="p-3 rounded-xl border w-full text-gray-800"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          disabled={isLoading}
                      />
                  </div>

                  <button
                      type="submit"
                      className="bg-[#f35640] mt-2 rounded-xl font-medium text-white py-3 hover:scale-105 duration-300 flex items-center justify-center"
                      disabled={isLoading}
                  >
                      {isLoading ? 'Updating...' : 'Reset Password'}
                  </button>

                  <button 
                      type="button"
                      onClick={() => { 
                          setView('login'); 
                          navigate('/login', { replace: true }); // Clear token from URL
                      }}
                      className="text-white text-sm hover:underline text-center mt-2"
                  >
                      Back to Login
                  </button>
              </form>
          )}

        </div>
      </div>
      
      <img src={tag} alt="logo" className="absolute top-1 right-1 w-40 h-auto" />
      </section>
  );
};

export default LoginPage;