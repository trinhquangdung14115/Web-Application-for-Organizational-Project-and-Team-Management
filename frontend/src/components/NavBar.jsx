import React, { useState } from 'react';
import { 
    ChevronDownIcon, 
    ArrowRightEndOnRectangleIcon, 
    UserCircleIcon 
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell'; 

// === TÁCH HEADERICONS VÀ NHẬN PROPS ===
const HeaderIcons = ({ user, unreadCount, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="flex space-x-4 items-center">
            {/* Dùng prop unreadCount */}
            <NotificationBell notificationCount={unreadCount} />

            {/* Avatar/User Info */}
            <div className="relative">
                {/* Nút bấm (avatar) */}
                <button 
                    className="flex items-center space-x-2 cursor-pointer p-1"
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                >
                    <div className="relative w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                        {user.initials || '??'}
                    </div>
                    {/* Hiển thị tên (ẩn trên mobile) */}
                    <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-700" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                    <div 
                        className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-1 z-50"
                        onMouseLeave={() => setIsDropdownOpen(false)} // (Tự đóng khi di chuột ra)
                    >
                        {/* Hiển thị thông tin user */}
                        <div className="px-4 py-3 border-b">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.role}</p>
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
const Navbar = ({ title, subtitle, user, unreadCount, onLogout }) => {
  return (
    <header className="flex justify-between items-start p-5 border-b bg-white sticky top-0 z-40">
        {/* Phần Title */}
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* 4. Truyền tất cả props xuống HeaderIcons */}
        <HeaderIcons 
            user={user}
            unreadCount={unreadCount}
            onLogout={onLogout}
        />
    </header>
  );
}

export default Navbar;
