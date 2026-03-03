import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { refreshProfile } from '../services/authService'; 
import Confetti from 'react-confetti'; 
import { 
    CheckCircleIcon, 
    ShieldCheckIcon,
    ArrowRightIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth(); 
    
    const [status, setStatus] = useState('loading'); 
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSyncData = async () => {
        try {
            console.log("Syncing profile data...");
            const data = await refreshProfile(); // Gọi hàm service
            
            if (data && data.user) {
                console.log("Profile synced:", data);
                setUser(data.user); // Cập nhật Context
                setStatus('success');
            } else {
                throw new Error("Failed to retrieve user data");
            }
        } catch (error) {
            console.error("Sync failed:", error);
            setErrorMsg(error.message || "Unknown error");
            setStatus('error');
        }
    };

    useEffect(() => {
        // Chờ 1.5s để đảm bảo Webhook phía Backend đã chạy xong DB update
        const timer = setTimeout(() => {
            handleSyncData();
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    const handleExplore = () => {
        navigate('/home'); 
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            
            {status === 'success' && (
                <Confetti 
                    width={windowSize.width} 
                    height={windowSize.height} 
                    recycle={false} 
                    numberOfPieces={500} 
                    gravity={0.15}
                />
            )}

            <div className="w-full max-w-md flex flex-col items-center z-10 animate-fade-in-up">
                
                {/*  LOADING  */}
                {status === 'loading' && (
                    <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-gray-100 border-t-black animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <ShieldCheckIcon className="w-8 h-8 text-gray-300" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-900">Verifying Payment...</h2>
                            <p className="text-gray-500 mt-2 text-sm">Please wait while we activate your privileges.</p>
                        </div>
                    </div>
                )}

                {/*  SUCCESS  */}
                {status === 'success' && (
                    <>
                        <div className="mb-10 relative group cursor-default">
                            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30"></div>
                            <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center relative shadow-sm border border-green-100 transform transition-transform group-hover:scale-105">
                                <CheckCircleIcon className="w-20 h-20 text-green-500 drop-shadow-sm" />
                                <div className="absolute -bottom-2 -right-2 bg-black text-white py-1 px-3 rounded-full border-4 border-white shadow-lg flex items-center gap-1 animate-bounce-slow">
                                    <ShieldCheckIcon className="w-4 h-4 text-yellow-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mb-12 space-y-3">
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Payment Successful!</h1>
                            <p className="text-gray-500 text-lg leading-relaxed max-w-[300px] mx-auto">
                                Congratulations! You have successfully upgraded to the <span className="font-bold text-black">Admin Plan</span>.
                            </p>
                        </div>

                        <button 
                            onClick={handleExplore}
                            className="w-full bg-black text-white font-bold text-lg py-4 px-6 rounded-2xl shadow-xl 
                                     hover:bg-gray-800 hover:shadow-2xl hover:-translate-y-1 
                                     active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 group"
                        >
                            <span>Explore your projects</span>
                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            onClick={() => navigate('/settings')}
                            className="mt-6 text-sm font-semibold text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            View Receipt
                        </button>
                    </>
                )}

                {/*  ERROR  */}
                {status === 'error' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upgrade Failed</h2>
                        <p className="text-gray-500 mb-6 max-w-xs">
                            We received your payment but couldn't verify automatically.
                        </p>
                        
                        <div className="bg-red-50 p-3 rounded-lg text-xs text-red-600 font-mono mb-6 max-w-xs break-all border border-red-100">
                            Error: {errorMsg}
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
                        >
                            Try Refreshing Page
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;