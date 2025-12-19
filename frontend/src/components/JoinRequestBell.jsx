import React, { useState, useEffect, useRef } from 'react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const JoinRequestBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const sidebarRef = useRef(null);

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/projects/pending-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setRequests(data.data || []);
    } catch (error) { console.error(error); }
  };

  // --- Gọi API ngay khi load trang + Auto refresh mỗi 30s ---
  useEffect(() => {
    fetchRequests(); // Gọi ngay lần đầu
    
    // Tự động cập nhật số lượng mỗi 15 giây (Polling)
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  // Click outside close
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarRef]);

  const handleAction = async (projectId, requestId, action) => {
    setActionLoading(requestId);
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_BASE_URL}/projects/${projectId}/members/${requestId}/approve`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action })
        });
        
        if (res.ok) {
            // Cập nhật lại list ngay lập tức
            setRequests(prev => prev.filter(req => req.requestId !== requestId));
        }
    } catch (error) { console.error(error); } 
    finally { setActionLoading(null); }
  };

  return (
    <div className="relative" ref={sidebarRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <UserPlusIcon className="w-6 h-6" />
        
        {/* --- Badge số lượng --- */}
        {requests.length > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">
                {requests.length > 9 ? '9+' : requests.length}
            </div>
        )}
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.2)] z-[60] transform transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col font-sans">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                    Join Requests
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">{requests.length}</span>
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                {requests.length === 0 ? (
                    <div className="text-center py-10 opacity-60">
                         <UserPlusIcon className="w-16 h-16 mx-auto text-gray-300 mb-3"/>
                         <p className="text-gray-500 font-medium">No pending requests</p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.requestId} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300">
                            {/* User Header */}
                            <div className="flex items-start gap-4 mb-4">
                                {req.user.avatar ? (
                                     <img src={req.user.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border border-gray-100"/>
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center font-bold text-lg">
                                        {req.user.name.charAt(0)}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 text-base truncate">{req.user.name}</h4>
                                    <p className="text-sm text-gray-500 truncate">{req.user.email}</p>
                                </div>
                            </div>
                            
                            {/* Project Info */}
                            <div className="ml-1 mb-5">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-sm font-bold text-gray-800">{req.projectName}</span>
                                </div>
                                <p className="text-xs text-gray-400 pl-4 font-mono">{formatDate(req.createdAt)}</p>
                            </div>

                            {/* Actions Buttons */}
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => handleAction(req.projectId, req.requestId, 'approve')}
                                    disabled={actionLoading === req.requestId}
                                    className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 disabled:scale-100"
                                >
                                    {actionLoading === req.requestId ? <Loader2 className="w-4 h-4 animate-spin"/> : <><CheckIcon className="w-5 h-5"/> Accept</>}
                                </button>
                                <button 
                                    onClick={() => handleAction(req.projectId, req.requestId, 'reject')}
                                    disabled={actionLoading === req.requestId}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm flex justify-center items-center gap-2 active:scale-95 disabled:opacity-70 disabled:scale-100"
                                >
                                    <XMarkIcon className="w-5 h-5"/> Deny
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default JoinRequestBell;