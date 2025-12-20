import React, { useState } from 'react';
import { 
    ChevronDownIcon, 
    ArrowRightEndOnRectangleIcon, 
    UserCircleIcon,
    SparklesIcon 
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell'; 
import JoinRequestBell from './JoinRequestBell';
import { useAuth } from '../services/AuthContext'; 
import axiosInstance from '../services/api'; // Import để gọi API thanh toán

// === TÁCH HEADERICONS VÀ NHẬN PROPS ===
const HeaderIcons = ({ unreadCount, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user } = useAuth(); // Lấy user từ Context
    
    // 1. Lấy thông tin Org từ localStorage để check Plan
    const storedOrg = localStorage.getItem("organization");
    const currentOrg = storedOrg ? JSON.parse(storedOrg) : null;

    // 2. Logic check: Chỉ hiện nút nếu là Admin và đang dùng gói FREE
    const isFreeAdmin = user?.role === 'Admin' && currentOrg?.plan === 'FREE';

    const canManageRequests = ['Admin', 'Manager'].includes(user?.role);
    const initials = user?.name
        ? user.name.split(" ").map(word => word[0]).join("").toUpperCase()
        : "??";

    // 3. Hàm xử lý khi bấm nút Upgrade
    const handleUpgrade = async () => {
        try {
            // Gọi API tạo session thanh toán
            const response = await axiosInstance.post('/payment/session');
            if (response.data && response.data.url) {
                // Redirect sang trang thanh toán Stripe
                window.location.href = response.data.url; 
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            alert("Unable to initiate payment. Please try again.");
        }
    };

    return (
        <div className="flex space-x-4 items-center">
            {/* BUTTON UPGRADE TO PREMIUM (Mới thêm) */}
            {isFreeAdmin && (
                <button
                    onClick={handleUpgrade}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#3b064d] to-[#f35640] text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                    <SparklesIcon className="w-4 h-4 text-yellow-200" />
                    <span>Upgrade Plan</span>
                </button>
            )}

            {/* JOIN REQUEST BELL - CHỈ HIỆN CHO ADMIN/MANAGER */}
            {canManageRequests && <JoinRequestBell />}
            
            {/* NOTIFICATION BELL */}
            <NotificationBell notificationCount={unreadCount} />

            {/* Avatar/User Info */}
            <div className="relative">
                {/* Nút bấm (avatar) */}
                <button 
                    className="flex items-center space-x-2 cursor-pointer p-1"
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                >
                    {user?.avatar ? (
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                    ) : (
                        <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border border-transparent"
                            style={{ 
                                backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)',
                                color: 'var(--color-brand)'                  
                            }}
                        >
                            {initials}
                        </div>
                    )}
                    {/* Hiển thị tên (ẩn trên mobile) */}
                    <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.name}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-700" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div 
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50"
                        onMouseLeave={() => setIsDropdownOpen(false)}
                    >
                        {/* Hiển thị thông tin user */}
                        <div className="px-4 py-3 border-b">
                            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.role}</p>
                            
                            {/* Hiển thị Badge Plan trong dropdown */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block ${currentOrg?.plan === 'PREMIUM' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                {currentOrg?.plan || 'FREE'} PLAN
                            </span>
                        </div>

                        {/* Nút Profile (UI-only) */}
                        <a href="#" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <UserCircleIcon className="w-5 h-5" />
                            Profile
                        </a>
                        
                        {/* Nút Logout */}
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                            <ArrowRightEndOnRectangleIcon className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Component Navbar chính (nhận props từ MainLayout)
const Navbar = ({ title, subtitle, unreadCount, onLogout }) => {
  return (
    <header className="flex justify-between items-start p-5 border-b bg-white sticky top-0 z-40">
        {/* Phần Title */}
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* 4. Truyền tất cả props xuống HeaderIcons */}
        <HeaderIcons 
            unreadCount={unreadCount}
            onLogout={onLogout}
        />
    </header>
  );
}

export default Navbar;