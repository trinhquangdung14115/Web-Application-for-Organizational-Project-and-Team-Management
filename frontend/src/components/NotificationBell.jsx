import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../services/AuthContext'; 
import { usePollingNotifications } from '../hooks/usePollingNotifications';

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Sử dụng Hook ở trên
    const { notifications, unreadCount, markAsRead } = usePollingNotifications(30000);

    const displayCount = unreadCount > 9 ? '9+' : unreadCount;
    const viewAllLink = user?.role === 'Admin' ? '/admin/notifications' : '/notifications';

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // --- Helper: Format thời gian ---
    const formatTime = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // --- 4. Xử lý Click (Logic quan trọng) ---
    const handleItemClick = (noti) => {
        // A. Gọi API đánh dấu đã đọc
        if (!noti.read) {
            markAsRead(noti._id);
        }
        
        setIsOpen(false); // Đóng menu

        // B. Redirect đến đúng chỗ
        const basePath = user?.role === 'Admin' ? '/admin' : '';

        if (noti.taskId) {
            // Nếu là task -> Chuyển đến trang Tasks và mở Modal
            navigate(`${basePath}/tasks?openTask=${noti.taskId}`);
        } else {
            // Nếu không phải task -> Về trang danh sách thông báo
            navigate(viewAllLink);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Nút Chuông */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`relative p-1 rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
            >
                <BellIcon className={`w-6 h-6 ${isOpen ? 'text-blue-600' : 'text-gray-700'}`} />
                {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white transform scale-90">
                        {displayCount}
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        <Link 
                            to={viewAllLink} 
                            onClick={() => setIsOpen(false)} 
                            className="text-xs font-bold hover:underline transition-colors"
                            style={{ color: 'var(--color-brand)' }} 
                        >
                            View All
                        </Link>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.slice(0, 5).map((noti) => (
                                <div 
                                    key={noti._id} 
                                    onClick={() => handleItemClick(noti)}
                                    className={`px-4 py-3 flex gap-3 cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${!noti.read ? 'bg-blue-50/50' : ''}`}
                                >
                                    {/* Icon hiển thị loại thông báo */}
                                    <div className="flex-shrink-0 mt-1">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
                                            ${noti.type === 'MENTION' ? 'bg-blue-500' : 
                                              noti.type === 'ASSIGNED' ? 'bg-purple-500' : 'bg-gray-400'}`}
                                        >
                                            {noti.type === 'MENTION' ? '@' : '!'}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-snug truncate ${!noti.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                            {noti.payload}
                                        </p>
                                        <p className="text-xs text-blue-500 font-medium mt-1">
                                            {formatTime(noti.createdAt)}
                                        </p>
                                    </div>

                                    {!noti.read && (
                                        <div className="self-center">
                                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-sm"></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No new notifications.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}