import React, { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { 
    ChatBubbleLeftEllipsisIcon, 
    CalendarIcon, 
    ClipboardDocumentListIcon,
    UserGroupIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../services/AuthContext'; 
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    const displayCount = unreadCount > 9 ? '9+' : unreadCount;
    const viewAllLink = user?.role === 'Admin' ? '/admin/notifications' : '/notifications';
    const basePath = user?.role === 'Admin' ? '/admin' : '';

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

    // --- LOGIC ĐIỀU HƯỚNG MỚI ---
    const handleItemClick = (noti) => {
        if (!noti.read) markAsRead(noti._id);
        setIsOpen(false); 

        const meta = noti.metadata || {};

        // 1. Nếu là MENTION -> Vào thẳng chi tiết Task
        if (noti.type === 'MENTION' && meta.taskId) {
            navigate(`${basePath}/tasks/${meta.taskId}`);
            return;
        }

        // 2. Nếu là ASSIGN -> Vào trang My Tasks (Kanban)
        if ((noti.type === 'ASSIGNED' || noti.type === 'TASK_ASSIGN')) {
            navigate(`${basePath}/tasks`);
            return;
        }

        // 3. Các loại Task khác (Overdue, Due Soon...) -> Thường muốn xem chi tiết để xử lý
        if (meta.taskId) {
             navigate(`${basePath}/tasks/${meta.taskId}`);
             return;
        }

        // 4. Meeting
        if (meta.meetingId) {
            navigate(`${basePath}/calendar`);
            return;
        }

        // 5. Project
        if (meta.projectId) {
            navigate(`${basePath}/projects`);
            return;
        }

        // Mặc định
        navigate(viewAllLink);
    };

    const getNotificationStyle = (type) => {
        switch (type) {
            case 'MENTION':
                return { icon: ChatBubbleLeftEllipsisIcon, color: 'text-blue-500', bg: 'bg-blue-100' };
            case 'TASK_ASSIGN':
            case 'ASSIGNED':
                return { icon: ClipboardDocumentListIcon, color: 'text-purple-500', bg: 'bg-purple-100' };
            case 'MEETING_CREATED':
                return { icon: CalendarIcon, color: 'text-orange-500', bg: 'bg-orange-100' };
            case 'PROJECT_ADD':
            case 'JOIN_REQUEST':
                return { icon: UserGroupIcon, color: 'text-green-500', bg: 'bg-green-100' };
            case 'TASK_OVERDUE':
            case 'DUE_SOON':
                return { icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-100' };
            default:
                return { icon: BellIcon, color: 'text-gray-500', bg: 'bg-gray-100' };
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Nút Chuông */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className={`relative p-2 rounded-full transition-colors focus:outline-none ${isOpen ? 'bg-blue-50 text-[var(--color-brand)]' : 'text-gray-500 hover:bg-gray-100 hover:text-[var(--color-brand)]'}`}
            >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                    <div className="absolute top-0 right-0 w-5 h-5 text-[10px] bg-red-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white transform translate-x-1/4 -translate-y-1/4">
                        {displayCount}
                    </div>
                )}
            </button>
             {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
                        <div className="flex gap-3 text-xs font-semibold">
                             <button onClick={markAllAsRead} className="text-gray-500 hover:text-[var(--color-brand)] transition">
                                Mark all read
                            </button>
                            <Link 
                                to={viewAllLink} 
                                onClick={() => setIsOpen(false)} 
                                className="text-[var(--color-brand)] hover:underline"
                            >
                                View All
                            </Link>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map((noti) => {
                                const style = getNotificationStyle(noti.type);
                                const Icon = style.icon;
                                return (
                                    <div 
                                        key={noti._id} 
                                        onClick={() => handleItemClick(noti)}
                                        className={`px-4 py-3 flex gap-3 cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${!noti.read ? 'bg-blue-50/30' : 'bg-white'}`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${style.bg} ${style.color}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm leading-snug ${!noti.read ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                                {noti.content}
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium mt-1">
                                                {formatDistanceToNow(new Date(noti.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {!noti.read && (
                                            <div className="self-center">
                                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm ring-2 ring-white"></div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                                <BellIcon className="w-8 h-8 text-gray-300 mb-2" />
                                No new notifications.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}