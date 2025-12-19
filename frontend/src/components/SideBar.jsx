import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import logoUserFull from '../assets/images/syncora-official.png'; 
import logoAdminFull from '../assets/images/syncora-admin.png';  
import logoAdmin from '../assets/images/logoadmin.png'; 
import logoUser from '../assets/images/logo.png';               


import { useAuth } from '../services/AuthContext'; 

import { 
    Squares2X2Icon, 
    CalendarDaysIcon, 
    BellIcon, 
    Cog6ToothIcon, 
    FolderIcon, 
    BriefcaseIcon,  
    UsersIcon,     
} from '@heroicons/react/24/outline';

// === MENU ITEMS ===
const menuItems = [
    { name: 'Dashboard', icon: Squares2X2Icon, href: '/home' },
    { name: 'Kanban', icon: FolderIcon, href: '/tasks', hideForAdmin: true },
    { name: 'Calendar', icon: CalendarDaysIcon, href: '/calendar' },
    { name: 'Members', icon: UsersIcon, href: '/members' },
    { name: 'Projects', icon: BriefcaseIcon, href: '/projects', adminOnly: true },
    { name: 'Notifications', icon: BellIcon, href: '/notifications' },
    { name: 'Settings', icon: Cog6ToothIcon, href: '/settings' },
];

const SidebarItem = ({ item, isActive, unreadCount, fullPath, isExpanded }) => {
    const activeStyle = {
        backgroundColor: isActive ? 'var(--color-brand)' : 'transparent',
    };

    return (
        <Link
            to={fullPath} 
            className={`
                group flex items-center p-3 rounded-lg transition-all duration-300 cursor-pointer 
                text-sm font-medium focus:outline-none 
                ${isExpanded ? 'justify-start space-x-3' : 'justify-center'}
            `}
            style={activeStyle}
            title={!isExpanded ? item.name : ''}
        >
            <div className="relative">
                <item.icon className={`w-6 h-6 transition-colors duration-300 min-w-[24px] ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                
                {!isExpanded && item.name === 'Notifications' && unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
                )}
            </div>

            <div 
                className={`
                    whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded ? 'w-40 opacity-100' : 'w-0 opacity-0'}
                `}
            >
                <span className={isActive ? 'text-white font-semibold' : 'text-gray-700 group-hover:text-gray-900'}>
                    {item.name}
                </span>
            </div>
            
            {isExpanded && item.name === 'Notifications' && !isActive && unreadCount > 0 && (
                <span className="ml-auto min-w-5 h-5 px-1.5 text-[10px] bg-red-500 rounded-full flex items-center justify-center text-white font-bold transition-opacity duration-300 delay-100">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </Link>
    );
};


const SideBar = ({ unreadCount, basePath="" }) => {
    const location = useLocation();
    const { user } = useAuth(); 
    const [isHovered, setIsHovered] = useState(false);

    const currentPath = location.pathname;
    const isAdmin = user?.role === 'Admin';
    const homeLink = isAdmin ? '/admin/home' : '/home';

    // --- LOGIC CHỌN LOGO  ---
    
    // Xác định xem nếu mở rộng thì dùng logo nào (Admin hay User)
    const currentFullLogo = isAdmin ? logoAdminFull : logoUserFull;

    // Xác định hiển thị logo Full hay logo Icon dựa trên trạng thái Hover
    const displaySrc = isHovered ? currentFullLogo : (isAdmin ? logoAdmin : logoUser);

    const visibleMenuItems = menuItems.filter(item => {
        if (item.hideForAdmin && isAdmin) return false;
        if (item.adminOnly && !isAdmin) return false;
        return true;
    });

    const isActive = (href) => {
        const fullPath = `${basePath}${href}`;
        if (href === '/home') return currentPath === fullPath;
        return currentPath.startsWith(fullPath);
    };

    return (
        <div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                h-screen bg-white border-r flex flex-col z-50
                transition-[width] duration-300 ease-in-out
                ${isHovered ? 'w-64 shadow-[10px_0_30px_-10px_rgba(0,0,0,0.15)]' : 'w-20 shadow-lg'}
            `} 
        >
            {/* (Logo Section) */}
            <div className={`
                flex items-center gap-2 pt-8 pb-4 transition-all duration-300 
                ${isHovered ? 'px-6 justify-start' : 'px-0 justify-center'}
            `}>
                <Link 
                    to={homeLink} 
                    className='flex items-center overflow-hidden focus:outline-none'
                > 
                    <img
                        className={`transition-all duration-300 object-contain 
                            ${isHovered ? 'h-9 w-auto' : 'h-14 w-14'}
                        `}
                        src={displaySrc} 
                        alt="Syncora Logo" 
                    />
                </Link>
            </div>

            {/* Menu chính */}
            <nav className="space-y-2 px-3 pb-4 flex-grow overflow-x-hidden">
                {visibleMenuItems.map((item) => (
                    <SidebarItem 
                        key={item.href}
                        item={item}
                        isActive={isActive(item.href)}
                        unreadCount={unreadCount}
                        fullPath={`${basePath}${item.href}`}
                        isExpanded={isHovered}
                    />
                ))}
            </nav>
        </div>
    );
}

export default SideBar;