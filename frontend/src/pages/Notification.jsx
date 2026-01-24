import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
    ChatBubbleLeftEllipsisIcon, 
    CalendarIcon, 
    ClipboardDocumentListIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    BellIcon,
    CheckIcon,
    CheckCircleIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline'; 
import { formatDistanceToNow } from 'date-fns';

import { LoaderOverlay } from '../components/LoaderOverlay';
import { useAuth } from '../services/AuthContext'; 
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { useNotifications } from '../context/NotificationContext';

const getNotiStyle = (type) => {
    switch (type) {
        case 'MENTION': 
            return { icon: ChatBubbleLeftEllipsisIcon, bg: 'bg-gray-100',  };
        case 'TASK_ASSIGN': 
        case 'ASSIGNED': 
            return { icon: ClipboardDocumentListIcon,  bg: 'bg-gray-100', };
        case 'MEETING_CREATED': 
            return { icon: CalendarIcon, bg: 'bg-gray-100', };
        case 'PROJECT_ADD': 
        case 'JOIN_REQUEST':
            return { icon: UserGroupIcon, bg: 'bg-gray-100', };
        case 'NEW_MEMBER':
            return { icon: UserPlusIcon, bg: 'bg-gray-100',  };
        case 'TASK_OVERDUE':
        case 'DUE_SOON':
             return { icon: ExclamationTriangleIcon, bg: 'bg-gray-100',  };
        default: 
            return { icon: BellIcon, bg: 'bg-gray-100',  };
    }
};

const NotificationItem = ({ data, onClick }) => {
    const { read, createdAt, content, type } = data;
    const style = getNotiStyle(type);
    const Icon = style.icon;

    return (
        <div 
            onClick={() => onClick(data)} 
            className={`group flex gap-4 p-4 border-b border-gray-100 last:border-0 transition-all duration-200 cursor-pointer hover:bg-gray-50
            ${!read ? 'bg-blue-50/30' : 'bg-white'}`}
        >
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm md:text-base leading-snug ${!read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {content}
                    </p>
                    {!read && (
                        <span className="w-2.5 h-2.5 bg-blue-600 rounded-full flex-shrink-0 mt-1.5 shadow-sm" title="Unread"></span>
                    )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium flex items-center gap-1 group-hover:text-[var(--color-brand)] transition-colors">
                    {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </p>
            </div>
        </div>
    );
};

const Notification = () => {
    const [filter, setFilter] = useState('All'); 
    const navigate = useNavigate();
    const { user } = useAuth(); 
    
    const { notifications, unreadCount, isLoading, isError, markAsRead, markAllAsRead } = useNotifications();

    //  LOGIC ĐIỀU HƯỚNG CHÍNH XÁC 
    const handleNotificationClick = async (item) => {
        if (!item.read) markAsRead(item._id);

        const basePath = user?.role === 'Admin' ? '/admin' : '';
        const meta = item.metadata || {};

        // NEW_MEMBER -> /members
        if (item.type === 'NEW_MEMBER') {
             navigate(`${basePath}/members`);
             return;
        }

        //  MENTION -> Vào thẳng chi tiết Task
        if (item.type === 'MENTION' && meta.taskId) {
             navigate(`${basePath}/tasks/${meta.taskId}`);
             return;
        } 
        
        //  ASSIGN -> Về trang Kanban (My Tasks)
        if (item.type === 'ASSIGNED' || item.type === 'TASK_ASSIGN') {
             navigate(`${basePath}/tasks`);
             return;
        }

        // Fallback cho các task noti khác (Overdue, Due Soon)
        if (meta.taskId) {
             navigate(`${basePath}/tasks/${meta.taskId}`);
             return;
        }

        // Các loại khác
        if (meta.meetingId) {
            navigate(`${basePath}/calendar`);
            return;
        } else if (meta.projectId) {
            navigate(`${basePath}/projects`);
            return;
        } else {
             navigate(`${basePath}/home`);
        }
    };

    const displayNotifications = notifications.filter(n => filter === 'All' || (filter === 'Unread' && !n.read));

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen flex justify-center">
            <div className="w-full max-w-3xl"> 
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">
                    <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-100 gap-3">
                        <div className="flex items-center gap-2 bg-gray-100/50 p-1 rounded-lg">
                            <button 
                                onClick={() => setFilter('All')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 
                                ${filter === 'All' ? 'bg-[var(--color-brand)] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                All
                            </button>
                            <button 
                                onClick={() => setFilter('Unread')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all duration-200 flex items-center gap-2 
                                ${filter === 'Unread' ? 'bg-[var(--color-brand)] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                            >
                                Unread
                                {unreadCount > 0 && (
                                    <span className={`text-[10px] py-0.5 px-1.5 rounded-full font-bold ${filter === 'Unread' ? 'bg-white text-[var(--color-brand)]' : 'bg-red-500 text-white'}`}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button 
                            onClick={() => markAllAsRead()}
                            disabled={unreadCount === 0}
                            className="text-sm font-semibold text-gray-500 hover:text-[var(--color-brand)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors px-2 py-1 rounded-md hover:bg-gray-50"
                        >
                            <CheckCircleIcon className="w-5 h-5" /> Mark all read
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center py-20"><LoaderOverlay /></div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                                <ExclamationTriangleIcon className="w-10 h-10 text-red-300 mb-2" />
                                <p className="text-gray-600 font-medium">Unable to load notifications</p>
                                <button onClick={() => window.location.reload()} className="text-sm text-blue-500 mt-2 hover:underline">Retry</button>
                            </div>
                        ) : displayNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-80 text-center animate-in fade-in zoom-in-95 duration-300">
                                <div className="bg-gray-50 p-4 rounded-full mb-3">
                                    <CheckIcon className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">No notifications</h3>
                                <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                {displayNotifications.map(n => (
                                    <NotificationItem 
                                        key={n._id}
                                        data={n}
                                        onClick={handleNotificationClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Notification;