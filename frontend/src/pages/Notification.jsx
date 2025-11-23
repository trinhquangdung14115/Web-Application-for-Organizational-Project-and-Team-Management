import React, { useState } from 'react';
import { 
    ChevronDownIcon, 
    BellIcon, 
    CheckIcon,
    CalendarIcon, 
    ChatBubbleLeftIcon, 
    ClockIcon, 
    ClipboardDocumentListIcon, 
    CheckCircleIcon, 
    UserGroupIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'; 
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';
import { EmptyState } from '../components/EmptyState';
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { mockNotifications } from '../mocks/notifications';

const PRIMARY_COLOR = '#f35640'; 

// ---Notification Item Component---
const NotificationItem = ({ type, project, task, sender, time, unread = true, avatarUrl }) => {
    let title, Icon, iconColor, content, iconBgColor; 

    // Gán icon và nội dung dựa trên loại thông báo
    switch (type) {
        case 'assigned':
            Icon = UserGroupIcon;
            iconColor = 'text-purple-500';
            iconBgColor = 'bg-purple-100'; 
            title = `You were assigned to Task "${task}"`;
            content = `${sender} assigned you to this task in ${project} project`;
            break;
        case 'mention':
            Icon = ChatBubbleLeftIcon;
            iconColor = 'text-blue-500';
            iconBgColor = 'bg-blue-100'; 
            title = `${sender} mentioned you in a comment`;
            content = `@You Great work on the API integration! Can you review the documentation?`;
            break;
        case 'due_soon':
            Icon = ClockIcon;
            iconColor = 'text-yellow-500';
            iconBgColor = 'bg-yellow-100'; 
            title = `Task "${task}" is due soon`;
            content = `This task is due tomorrow at 5:00 PM`;
            break;
        case 'completed':
            Icon = SolidCheckCircleIcon;
            iconColor = 'text-green-500';
            iconBgColor = 'bg-green-100'; 
            title = `${sender} completed "${task}"`;
            content = `${sender} marked as complete in ${project} project`;
            break;
        case 'comment':
            Icon = ChatBubbleLeftIcon;
            iconColor = 'text-indigo-500';
            iconBgColor = 'bg-indigo-100'; 
            title = `New comment on "User Authentication"`;
            content = `${sender}: I've updated the security requirements. Please review.`;
            break;
        default:
            Icon = ClipboardDocumentListIcon;
            iconColor = 'text-gray-500';
            iconBgColor = 'bg-gray-100'; 
            title = "New Notification";
            content = "This is a generic notification message.";
    }
    return (
        <div className={`flex items-start p-4 hover:bg-gray-50 transition border-b border-gray-100 ${unread ? 'bg-white' : 'bg-gray-50'}`}>
            {/* Icon với màu nền */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBgColor} ${iconColor}`}>
                <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 ml-4 flex flex-col">
                <p className="text-sm font-medium text-gray-900 cursor-pointer hover:text-red-600 transition">
                    {title}
                </p>
                <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">
                    {content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    {time}
                </p>
            </div>

            {/* Icon Trạng thái / Unread Dot */}
            <div className="w-5 flex justify-end">
                {unread ? (
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                ) : (
                    <div className="w-2 h-2 rounded-full bg-gray-300 mt-2" />
                )}
            </div>
        </div>
    );
};

// ---Notification List Panel---
const NotificationList = () => {

    const [filter, setFilter] = useState('All'); // 'All' | 'Unread'
    const [isLoading, setIsLoading] = useState(true); // <-- Bắt đầu bằng true
    const [isError, setIsError] = useState(false);
    const [notifications, setNotifications] = useState([]);
    React.useEffect(() => {
        setIsLoading(true);
        setIsError(false);
        const timer = setTimeout(() => {
            // Bản dữ liệu thành công
            setNotifications(mockNotifications); 
            setIsLoading(false);

            // Bản lỗi
            //setIsError(true);
            //setIsLoading(false);

            // Bản không có thông báo
            //setNotifications([]); 
            //setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);    
    
    const handleMarkAllRead = () => {
        console.log("Marking all notifications as read...");
        const allRead = notifications.map(n => ({ ...n, unread: false }));
        setNotifications(allRead);
    };
    
    // Lọc dựa trên state 'notifications'
    const filteredNotifications = notifications.filter(n => 
        filter === 'All' || (filter === 'Unread' && n.unread)
    );
    
    // Đếm số lượng 'unread' từ state
    const unreadCount = notifications.filter(n => n.unread).length;

    // Nút tab filter
    const FilterButton = ({ label, currentFilter, onClick }) => {
        const isActive = label === currentFilter;
        return (
            <button
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                        ? 'text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                }`}
                style={isActive ? { backgroundColor: PRIMARY_COLOR } : {}}
                onClick={() => onClick(label)}
            >
                {label}
                {label === 'Unread' && unreadCount > 0 && ( // Chỉ hiển thị count nếu > 0
                    <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-600" style={{ color: PRIMARY_COLOR, backgroundColor: '#fee2e2' }}>
                        {unreadCount}
                    </span>
                )}
            </button>
        );
    }
    const renderContent = () => {
        // Trạng thái Loading
        if (isLoading) {
            // LoaderOverlay sẽ che phủ toàn bộ khu vực của nó
            return <LoaderOverlay />;
        }

        // Trạng thái Error
        if (isError) {
            return (
                <ErrorState 
                    icon={<ExclamationTriangleIcon className="w-12 h-12 text-red-400" />}
                    title="Could not load notifications"
                    message="An error occurred while fetching data. Please try again later."
                />
            );
        }

        // Trạng thái Rỗng (Không có thông báo nào)
        if (filteredNotifications.length === 0) {
            // Phân biệt lý do rỗng (do filter hay do không có data)
            const emptyTitle = (notifications.length === 0) 
                ? "No notifications yet" 
                : "You are all caught up!";
            
            const emptyMessage = (notifications.length === 0)
                ? "New notifications will appear here."
                : (filter === 'Unread' ? 'No unread notifications.' : 'No new notifications.');

            return (
                <EmptyState 
                    icon={<CheckIcon className="w-12 h-12 text-green-400" />}
                    title={emptyTitle}
                    message={emptyMessage}
                />
            );
        }

        // 4. Trạng thái có dữ liệu
        return (
            filteredNotifications.map(n => (
                <NotificationItem 
                    key={n.id}
                    {...n}
                />
            ))
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col min-h-[70vh]">
            {/* Header: Filters and Mark All Read */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <div className="flex space-x-3">
                    <FilterButton label="All" currentFilter={filter} onClick={setFilter} />
                    <FilterButton label="Unread" currentFilter={filter} onClick={setFilter} />
                </div>
                <button 
                    className="text-sm font-medium text-gray-500 hover:text-red-600 transition"
                    onClick={handleMarkAllRead} 
                    disabled={isLoading || isError} // Vô hiệu hóa nút khi đang tải/lỗi
                >
                    Mark all as read
                </button>
            </div>

            {/* List (Nội dung động) */}
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};

// ---Notification Page Component---
const Notification = () => {
    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            {/* Nội dung chính: Danh sách thông báo */}
            <div className="max-w-4xl mx-auto"> 
                <NotificationList />
            </div>
        </div>
    );
}


export default Notification;