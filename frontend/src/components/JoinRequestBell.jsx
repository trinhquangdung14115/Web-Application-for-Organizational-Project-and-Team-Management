import React, { useState, useEffect, useRef } from 'react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../services/AuthContext'; 
import { API_BASE_URL } from '../utils/constants';

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
};

const JoinRequestBell = () => {
  const { user } = useAuth(); 
  
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const sidebarRef = useRef(null);

  const fetchRequests = async () => {
    if (!user || !['Admin', 'Manager'].includes(user.role)) return;

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/projects/pending-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 403) return;

      const data = await res.json();
      if (res.ok) setRequests(data.data || []);
    } catch (error) { 
        console.error("Fetch requests failed:", error); 
    }
  };

  const handleAction = async (projectId, requestId, action) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    setActionLoading(requestId);
    try {
        const res = await fetch(`${API_BASE_URL}/projects/${projectId}/members/${requestId}/approve`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action })
        });
        const data = await res.json();
        if (data.success) {
            setRequests(prev => prev.filter(req => req.requestId !== requestId));
        } else {
            alert(data.message || 'Action failed');
        }
    } catch (error) {
        console.error("Action error:", error);
    } finally {
        setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Auto refresh mỗi 30s
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
        if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarRef]);

  if (!user || !['Admin', 'Manager'].includes(user.role)) {
      return null;
  }

  return (
    <div className="relative" ref={sidebarRef}>
      {/* --- Trigger Button --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'}`}
      >
        <UserPlusIcon className="w-6 h-6" />
        {requests.length > 0 && (
            <div className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white transform translate-x-1/4 -translate-y-1/4 shadow-sm">
                {requests.length > 9 ? '9+' : requests.length}
            </div>
        )}
      </button>

      {/* --- Sidebar / Drawer --- */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-[100] w-[400px] bg-white shadow-2xl border-l border-gray-100 flex flex-col transform transition-transform duration-300 ease-in-out">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-800">Pending Requests</h3>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                        {requests.length}
                    </span>
                </div>
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 p-5 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-300"/></div>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60 pb-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <UserPlusIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-gray-900 font-semibold mb-1">No requests</h4>
                        <p className="text-sm text-gray-500">All caught up! No one is waiting.</p>
                    </div>
                ) : (
                    requests.map((req) => {
                        // Safe Data Access
                        const userObj = req.user || {};
                        const userName = userObj.name || req.userName || "Unknown User";
                        const userEmail = userObj.email || req.userEmail || "";
                        const userAvatar = userObj.avatar || req.userAvatar; 

                        return (
                            <div key={req.requestId} className="bg-white p-4 rounded-xl border border-gray-200/75 shadow-sm hover:shadow-md transition-shadow duration-200">
                                {/* Top: User Info */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {userAvatar ? (
                                            <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-gray-500">{userName.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-bold text-gray-900 truncate">{userName}</h4>
                                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                                                {formatDate(req.requestedAt).split(',')[0]}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate mb-1">{userEmail}</p>
                                        <div className="inline-flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded text-[11px] font-medium text-blue-700">
                                            <span>Project:</span>
                                            <span className="font-bold truncate max-w-[150px]">{req.projectName}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom: Actions */}
                                <div className="flex gap-2 mt-2 pt-3 border-t border-gray-50">
                                    <button 
                                        onClick={() => handleAction(req.projectId, req.requestId, 'approve')}
                                        disabled={actionLoading === req.requestId}
                                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm flex justify-center items-center gap-1.5 active:scale-95 disabled:opacity-70"
                                    >
                                        {actionLoading === req.requestId ? <Loader2 className="w-3 h-3 animate-spin"/> : <><CheckIcon className="w-3 h-3"/> Accept</>}
                                    </button>
                                    <button 
                                        onClick={() => handleAction(req.projectId, req.requestId, 'reject')}
                                        disabled={actionLoading === req.requestId}
                                        className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm flex justify-center items-center gap-1.5 active:scale-95 disabled:opacity-70"
                                    >
                                        <XMarkIcon className="w-3 h-3"/> Deny
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default JoinRequestBell;