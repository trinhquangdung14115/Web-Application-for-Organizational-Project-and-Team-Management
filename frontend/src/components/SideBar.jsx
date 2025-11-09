import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/images/syncora.png'; 
import { 
    Squares2X2Icon, 
    CalendarDaysIcon, 
    BellIcon, 
    Cog6ToothIcon, 
    FolderIcon 
} from '@heroicons/react/24/outline';


const PRIMARY_COLOR = '#f35640'; 

const menuItems = [
    { name: 'Dashboard', icon: Squares2X2Icon, href: '/' },
    { name: 'My Tasks', icon: FolderIcon, href: '/tasks' },
    { name: 'Calendar', icon: CalendarDaysIcon, href: '/calendar' },
    { name: 'Notifications', icon: BellIcon, href: '/notifications' },
    { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
];

/**
 * Component cho từng mục menu (Sidebar Item)
 */
const SidebarItem = ({ item, isActive }) => {
    // Style động theo trạng thái active
    const activeStyle = {
        backgroundColor: isActive ? PRIMARY_COLOR : 'transparent',
    };

    return (
        <Link
            to={item.href} 
            className="flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            style={activeStyle}
        >
            {/* Icon: Đổi màu theo trạng thái active/hover */}
            <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
            
            {/* Tên mục: Đổi màu theo trạng thái active/hover */}
            <span className={isActive ? 'text-white font-semibold' : 'text-gray-700 group-hover:text-gray-900'}>
                {item.name}
            </span>
            
            {/* Badge thông báo */}
            {item.name === 'Notifications' && !isActive && (
                <span className="ml-auto min-w-4 h-4 px-1 text-[10px] bg-red-500 rounded-full flex items-center justify-center text-white font-bold animate-pulse">
                    3
                </span>
            )}
        </Link>
    );
};

/**
 * Component chính SideBar
 */
const SideBar = () => {
    const location = useLocation();
    const currentPath = location.pathname;
    return (
        <div 
            className="w-56 bg-white border-r h-screen flex flex-col shadow-lg" 
        >
            {/* Logo Section */}
            <div className="flex items-center justify-center gap-2 px-3 pt-8 pb-4">
                <a className='flex items-center' href='/'> 
                    <img
                        className="h-9 w-auto"
                        src={ logo } 
                        alt="Syncora Logo" 
                    />
                </a>
            </div>

            {/* Menu chính */}
            <nav className="space-y-2 px-3 pb-4 flex-grow">
                {menuItems.map((item) => (
                    <SidebarItem 
                        key={item.href}
                        item={item}
                        isActive={currentPath === item.href}
                    />
                ))}
            </nav>
            </div>
    );
}

export default SideBar;
