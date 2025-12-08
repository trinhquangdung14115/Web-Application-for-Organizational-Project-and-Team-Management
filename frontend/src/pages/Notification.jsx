import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { 
    CheckIcon,
    ChatBubbleLeftIcon, 
    ClockIcon, 
    UserGroupIcon,
    ExclamationTriangleIcon,
    BellIcon
} from '@heroicons/react/24/outline'; 
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';

import { EmptyState } from '../components/EmptyState';
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { useAuth } from '../services/AuthContext'; 
import { usePollingNotifications } from '../hooks/usePollingNotifications';

// --- Helper: Chuẩn hóa dữ liệu Backend sang UI (Tiếng Anh) ---
const normalizeNotification = (beData) => {
    let icon = BellIcon;
    let iconColor = 'text-gray-500';
    let iconBg = 'bg-gray-100';
    let title = "New Notification";
    const content = beData.payload; 

    switch (beData.type) {
        case 'MENTION':
            icon = ChatBubbleLeftIcon;
            iconColor = 'text-blue-500';
            iconBg = 'bg-blue-100';
            title = "You were mentioned";
            break;
        case 'ASSIGNED':
            icon = UserGroupIcon;
            iconColor = 'text-purple-500';
            iconBg = 'bg-purple-100';
            title = "Task Assignment";
            break;
        case 'DUE_SOON': 
            icon = ClockIcon;
            iconColor = 'text-yellow-500';
            iconBg = 'bg-yellow-100';
            title = "Task Due Soon";
            break;
        case 'COMPLETED':
            icon = SolidCheckCircleIcon;
            iconColor = 'text-green-500';
            iconBg = 'bg-green-100';
            title = "Task Completed";
            break;
        default:
            break;
    }

    return {
        ...beData,
        ui: { icon, iconColor, iconBg, title, content }
    };
};

// --- Component con: 1 dòng thông báo ---
const NotificationItem = ({ data, onClick }) => {
    const { read, createdAt } = data;
    const { icon: Icon, iconColor, iconBg, title, content } = data.ui;

    const timeString = new Date(createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div 
            onClick={() => onClick(data)} 
            className={`flex items-start p-4 hover:bg-gray-50 transition border-b border-gray-100 cursor-pointer ${!read ? 'bg-white' : 'bg-gray-50'}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg} ${iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 ml-4 flex flex-col">
                <p className={`text-sm ${!read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                    {title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {timeString}
                </p>
            </div>

            <div className="w-5 flex justify-end">
                {!read && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" title="Unread" />
                )}
            </div>
        </div>
    );
};

// --- Component Danh sách chính ---
const NotificationList = () => {
    const [filter, setFilter] = useState('All'); 
    const navigate = useNavigate();
    const { user } = useAuth(); 
    
    // Sử dụng Hook lấy dữ liệu
    const { notifications, unreadCount, isLoading, isError, refresh, markAsRead, markAllAsRead } = usePollingNotifications(30000);

    const handleNotificationClick = async (item) => {
        if (!item.read) markAsRead(item._id);

        const basePath = user?.role === 'Admin' ? '/admin' : '';
        if (item.taskId) {
            // Chuyển hướng sang task, thêm tham số để component Tasks tự mở modal
            navigate(`${basePath}/tasks?openTask=${item.taskId}`);
        } else {
             navigate(`${basePath}/home`);
        }
    };

    const displayNotifications = notifications
        .map(normalizeNotification)
        .filter(n => filter === 'All' || (filter === 'Unread' && !n.read));

    const FilterButton = ({ label, active, onClick }) => (
        <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                active ? 'text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={active ? { backgroundColor: 'var(--color-brand)' } : {}}
            onClick={() => onClick(label)}
        >
            {label} 
            {label === 'Unread' && unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-white text-red-600">
                    {unreadCount}
                </span>
            )}
        </button>
    );

    // Render nội dung dựa trên trạng thái (Loading, Error, Empty, List)
    const renderContent = () => {
        if (isLoading && notifications.length === 0) return <LoaderOverlay />;
        
        if (isError) {
            return (
                <ErrorState 
                    icon={<ExclamationTriangleIcon className="w-12 h-12 text-red-400" />}
                    title="Connection Error"
                    message="Could not load notifications."
                    onRetry={refresh}
                />
            );
        }

        if (displayNotifications.length === 0) {
            return (
                <EmptyState 
                    icon={<CheckIcon className="w-12 h-12 text-green-400" />}
                    title="All caught up!"
                    message={filter === 'Unread' ? "You have no unread notifications." : "You have no notifications."}
                />
            );
        }

        return displayNotifications.map(n => (
            <NotificationItem 
                key={n._id}
                data={n}
                onClick={handleNotificationClick}
            />
        ));
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col min-h-[70vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <div className="flex space-x-3">
                    <FilterButton label="All" active={filter === 'All'} onClick={setFilter} />
                    <FilterButton label="Unread" active={filter === 'Unread'} onClick={setFilter} />
                </div>
                <button 
                    className="text-sm font-medium text-gray-500 transition hover:text-[var(--color-brand)]"
                    onClick={() => markAllAsRead()}
                    disabled={unreadCount === 0}
                >
                    Mark all as read
                </button>
            </div>
            
            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

// --- Wrapper Page ---
const Notification = () => {
    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto"> 
                <NotificationList />
            </div>
        </div>
    );
}

export default Notification;