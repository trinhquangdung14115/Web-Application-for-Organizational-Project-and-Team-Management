import React, { useState ,useEffect} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import logoUserFull from '../assets/images/syncora-official.png'; 
import logoAdminFull from '../assets/images/syncora-admin.png';  
import logoAdmin from '../assets/images/logoadmin.png'; 
import logoUser from '../assets/images/logo.png'; 
import axiosInstance from '../services/api';              


import { useAuth } from '../services/AuthContext'; 

import { 
    Squares2X2Icon, 
    CalendarDaysIcon, 
    BellIcon, 
    Cog6ToothIcon, 
    FolderIcon, 
    BriefcaseIcon,  
    UsersIcon, 
    ChevronUpDownIcon, 
    CheckIcon
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
            <ProjectSwitcher isExpanded={isHovered} />
        </div>
    );
}
const ProjectSwitcher = ({ isExpanded }) => {
    const { selectedProjectId, selectedProjectName, switchProject } = useProject();
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const isAdmin = user?.role === 'Admin';

    // Fetch list dự án 1 lần khi mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Dùng axiosInstance thay vì fetch thường
                const res = await axiosInstance.get('/projects');
                if(res.data.success) setProjects(res.data.data);
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!isAdmin && selectedProjectId === 'all' && projects.length > 0) {
            // Nếu không phải Admin mà đang ở 'all', chuyển ngay về dự án đầu tiên
            switchProject(projects[0]._id, projects[0].name);
        }
    }, [isAdmin, selectedProjectId, projects, switchProject]);

    const handleSelect = (id, name) => {
        switchProject(id, name);
        setIsOpen(false);
    };

    return (
        <div className="px-3 pb-4 mt-auto border-t border-gray-100 pt-3 relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-all border border-gray-200 ${!isExpanded ? 'justify-center' : ''}`}
            >
                <div className="w-8 h-8 rounded bg-[var(--color-brand)] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {selectedProjectName.substring(0, 2).toUpperCase()}
                </div>
                
                {isExpanded && (
                    <div className="flex-1 text-left overflow-hidden">
                        <p className="text-xs text-gray-500 font-semibold">Current Workspace</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{selectedProjectName}</p>
                    </div>
                )}
                
                {isExpanded && <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />}
            </button>

            {/* DROPDOWN MENU - Hiện ra khi bấm */}
            {isOpen && (
                <div className="absolute bottom-full left-3 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 mb-2 p-2 z-[60] animate-in slide-in-from-bottom-2">
                    <p className="px-2 py-1 text-xs font-bold text-gray-400 uppercase">Select Project</p>
                    
                    {/* Option All Projects */}
                    {isAdmin && (
                        <>
                            <button onClick={() => handleSelect('all', 'All Projects')} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-between">
                                <span>All Projects</span>
                                {selectedProjectId === 'all' && <CheckIcon className="w-4 h-4 text-green-600"/>}
                            </button>
                            <div className="h-px bg-gray-100 my-1"></div>
                        </>
                    )}

                    {/* List Projects */}
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        {projects.map(p => (
                            <button key={p._id} onClick={() => handleSelect(p._id, p.name)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-between group">
                                <span className="truncate">{p.name}</span>
                                {selectedProjectId === p._id && <CheckIcon className="w-4 h-4 text-green-600"/>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
export default SideBar;