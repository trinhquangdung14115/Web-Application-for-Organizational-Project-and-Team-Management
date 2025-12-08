import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { ArrowLeft, Check, Crown, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

import logoIcon from '../assets/images/logo.png'; 
import logoText from '../assets/images/syncora-official.png'; 

const API_BASE_URL = 'http://localhost:4000/api';

export default function PricingPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('Free');
  
  // State Join Project
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinLink, setJoinLink] = useState('');
  const [joinError, setJoinError] = useState(''); 
  const [isJoining, setIsJoining] = useState(false);

  // State Payment
  const [paymentError, setPaymentError] = useState(''); 

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentError('');
  };

  // --- LOGIC CHỌN GÓI ADMIN ---
  const handleAdminUpgrade = async () => {
    setPaymentError('');
    const token = localStorage.getItem('token');
    
    // Chưa đăng nhập -> Sang Signup
    if (!token) {
        navigate('/signup', { state: { from: 'pricing', plan: 'Admin' } });
        return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payment/session`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url; 
      } else {
        setPaymentError(data.message || 'Payment initiation failed.');
      }
    } catch (error) {
      setPaymentError('Connection error. Please try again.');
    }
  };

  const handleFreePlan = () => {
      const token = localStorage.getItem('token');
      if (token) navigate('/home'); 
      else navigate('/login');
  };

  // --- LOGIC JOIN PROJECT ---
  const handleJoinProject = async () => {
      setJoinError('');
      if (!joinLink.trim()) {
          setJoinError('Please enter a code or link.');
          return;
      }

      // Tách mã invite
      let inviteCode = joinLink.trim();
      if (inviteCode.includes('/')) {
          inviteCode = inviteCode.split('/').pop();
      }

      const token = localStorage.getItem('token');
      
      // Chưa login -> Chuyển sang SIGN UP (Kèm mã invite để xử lý sau)
      if (!token) {
          navigate('/signup', { state: { from: 'pricing', action: 'join', code: inviteCode } });
          return;
      }

      // Đã login -> Gọi API Join trực tiếp
      setIsJoining(true);
      try {
          const res = await fetch(`${API_BASE_URL}/projects/join`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ inviteCode })
          });
          
          const data = await res.json();
          
          if (res.ok) {
              navigate('/home'); 
          } else {
              setJoinError(data.message || "Failed to join project.");
          }
      } catch (error) {
          setJoinError("Connection error. Please try again.");
      } finally {
          setIsJoining(false);
      }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -right-40 w-80 h-80 bg-orange-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-40 -left-40 w-96 h-96 bg-orange-600 rounded-full opacity-10 blur-3xl"></div>
      </div>

      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
            <img src={logoIcon} alt="Logo Icon" className="w-14 h-14 object-contain transition-transform group-hover:scale-105" />
            <img src={logoText} alt="Syncora Text" className="h-8 object-contain transition-transform group-hover:scale-105" />
        </div>
        <Link to="/introduction" className="flex items-center gap-2 px-6 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-black transition-all duration-300 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </nav>

      <div className="relative z-10 container mx-auto px-6 py-10">
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl mb-6 bg-gradient-to-r from-white via-orange-100 to-orange-500 bg-clip-text text-transparent font-extrabold">
              Select Your Workspace Plan
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              You're almost there! Choose a plan to start organizing your projects.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {/* FREE PLAN */}
            <div onClick={() => handleSelectPlan('Free')} className={`bg-zinc-900 rounded-2xl border-2 p-8 transition-all duration-300 cursor-pointer flex flex-col ${selectedPlan === 'Free' ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] scale-[1.02]' : 'border-zinc-800 hover:border-orange-500/50'}`}>
              <div className="mb-6">
                <h3 className="text-2xl mb-2 font-bold">Free Plan</h3>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl text-orange-500 font-bold">$0</span><span className="text-gray-400">/forever</span></div>
                <p className="text-gray-400">Perfect for individuals getting started.</p>
              </div>
              <div className="space-y-4 mb-8 flex-grow">
                {['Create 1 project', 'Basic task management', 'Up to 3 team members', 'Community support'].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-orange-500" /></div><span className="text-gray-300">{feature}</span></div>
                ))}
              </div>
              <button onClick={handleFreePlan} className="block w-full py-3 px-6 bg-zinc-800 text-white text-center rounded-lg hover:bg-zinc-700 transition-all duration-300 border border-zinc-700 font-bold">Continue with Free</button>
            </div>

            {/* ADMIN PLAN */}
            <div onClick={() => handleSelectPlan('Admin')} className={`bg-gradient-to-b from-orange-500/10 to-zinc-900 rounded-2xl border-2 p-8 relative transition-all duration-300 cursor-pointer flex flex-col ${selectedPlan === 'Admin' ? 'border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-[1.02]' : 'border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20'}`}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2"><div className="bg-orange-500 text-black px-4 py-1 rounded-full text-sm flex items-center gap-1 font-bold shadow-lg"><Crown className="w-4 h-4" /> Most Popular</div></div>
              <div className="mb-6">
                <h3 className="text-2xl mb-2 font-bold">Admin Plan</h3>
                <div className="flex items-baseline gap-2 mb-4"><span className="text-5xl text-orange-500 font-bold">$20</span><span className="text-gray-400">/month</span></div>
                <p className="text-gray-400">Unlock full power for your team.</p>
              </div>
              <div className="space-y-4 mb-8 flex-grow">
                {['Unlimited projects', 'Full admin control panel', 'Unlimited team members', 'Advanced analytics'].map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-black" /></div><span className="text-white">{feature}</span></div>
                ))}
              </div>
              <button onClick={handleAdminUpgrade} className="w-full py-3 px-6 bg-orange-500 text-black rounded-lg hover:bg-orange-600 transition-all duration-300 shadow-lg shadow-orange-500/50 font-bold">Get Admin Access</button>
              
              {paymentError && <div className="mt-3 flex items-center gap-2 text-red-500 text-sm justify-center animate-pulse"><AlertCircle className="w-4 h-4" /><span>{paymentError}</span></div>}
            </div>
          </div>

          {/* JOIN PROJECT */}
          <div className="max-w-2xl mx-auto mb-16 pt-8 border-t border-zinc-800">
             <div className="text-center">
                <p className="text-gray-300 text-lg mb-4">
                  Already have a project?{' '}
                  <button onClick={() => setShowJoinInput(!showJoinInput)} className="text-orange-500 font-bold hover:text-orange-400 hover:underline transition-colors focus:outline-none">Join here</button>
                </p>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showJoinInput ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="flex flex-col gap-2">
                        <div className={`flex gap-2 p-2 bg-zinc-900 border rounded-xl ${joinError ? 'border-red-500' : 'border-zinc-700'}`}>
                            <input type="text" placeholder="Paste your invite link here..." className="flex-1 bg-transparent border-none text-white px-4 focus:ring-0 placeholder-gray-500 outline-none" value={joinLink} onChange={(e) => { setJoinLink(e.target.value); if (joinError) setJoinError(''); }} />
                            <button disabled={isJoining} onClick={handleJoinProject} className="bg-orange-500 text-black font-bold px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50">
                                {isJoining ? <Loader2 className="w-4 h-4 animate-spin"/> : <>Join <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </div>
                        {joinError && <p className="text-red-500 text-sm text-left pl-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {joinError}</p>}
                    </div>
                </div>
             </div>
          </div>

          <div className="text-center pb-8">
            <p className="text-gray-400 mb-4">All plans include 14-day money-back guarantee</p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <span>✓ Secure payments</span>
              <span>✓ Cancel anytime</span>
              <span>✓ No hidden fees</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}