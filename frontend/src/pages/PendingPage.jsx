import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, RefreshCw, LogOut, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext';
import logoIcon from '../assets/images/logo.png'; 
import logoText from '../assets/images/syncora-official.png'; 

const API_BASE_URL = 'http://localhost:4000/api';

const PendingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState('pending'); // 'pending' | 'approved'

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      // Nếu có dự án -> Đã được Accept
      if (response.ok && data.data && data.data.length > 0) {
        setStatus('approved');
        setTimeout(() => navigate('/home'), 1500); // Delay 1.5s để user thấy chữ Approved
      }
    } catch (error) {
      console.error("Status check failed", error);
    } finally {
      // Giữ loading giả thêm 500ms cho mượt
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  useEffect(() => {
    checkStatus();
    // Auto check mỗi 10 giây
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
            <img src={logoIcon} alt="Logo" className="w-10 h-10 object-contain" />
            <img src={logoText} alt="Syncora" className="h-6 object-contain" />
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium px-4 py-2 rounded-full hover:bg-white/10">
            <LogOut size={16} /> Sign Out
        </button>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl text-center transform transition-all">
          
          <div className="mb-8 flex justify-center">
             <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-500 ${status === 'approved' ? 'bg-green-500/20' : 'bg-orange-500/10'}`}>
                {status === 'approved' ? (
                    <CheckCircle2 className="w-12 h-12 text-green-500 animate-in zoom-in duration-300" />
                ) : (
                    <Clock className="w-12 h-12 text-orange-500 animate-pulse" />
                )}
             </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">
            {status === 'approved' ? 'Access Granted!' : 'Request Pending'}
          </h2>
          
          <p className="text-gray-400 mb-8 text-base leading-relaxed">
            {status === 'approved' ? (
                "Redirecting you to the workspace..."
            ) : (
                <>Hi <span className="text-white font-semibold">{user?.name}</span>, your request has been sent. Waiting for a manager to approve your access.</>
            )}
          </p>

          <div className="space-y-4">
             {status === 'pending' && (
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between group">
                    <span className="text-sm text-gray-400">Status check:</span>
                    <span className="text-sm font-mono text-orange-400 flex items-center gap-2">
                        {isChecking ? <Loader2 size={14} className="animate-spin"/> : <span className="w-2 h-2 rounded-full bg-orange-500"></span>}
                        Waiting
                    </span>
                 </div>
             )}

             <button 
                onClick={checkStatus} 
                disabled={isChecking || status === 'approved'}
                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                    status === 'approved' 
                    ? 'bg-green-500 text-white cursor-default'
                    : 'bg-white text-black hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98]'
                }`}
             >
                {isChecking ? <Loader2 className="animate-spin" /> : status === 'approved' ? 'Entering...' : <> <RefreshCw size={18} /> Check Status </>}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingPage;