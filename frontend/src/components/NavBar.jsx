import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell'; 

const HeaderIcons = () => {
    return (
        <div className="flex space-x-4 items-center">
            <NotificationBell notificationCount={3} />

            {/* Avatar/User Info */}
            <div className="flex items-center space-x-2 cursor-pointer">
                <div className="relative w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    JD
                    <div 
                        className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-red-500 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white"
                    >
                        30
                    </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-700" />
            </div>
        </div>
    );
};


// Component Navbar chính, nhận props
const Navbar = ({ title, subtitle }) => {
  return (
    <header className="flex justify-between items-start p-5 border-b bg-white">
        {/* Phần Title (được truyền từ MainLayout) */}
        <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        {/* Phần Icons (cố định) */}
        <HeaderIcons />
    </header>
  );
}

export default Navbar;
