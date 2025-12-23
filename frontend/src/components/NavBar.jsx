import React, { useState, useEffect, useRef } from 'react'; 
import { 
    ChevronDownIcon, 
    ArrowRightEndOnRectangleIcon, 
    UserCircleIcon,
    SparklesIcon,
    ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell'; 
import JoinRequestBell from './JoinRequestBell';
import ChatBox from './ChatBox'; 
import { useAuth } from '../services/AuthContext'; 
import axiosInstance from '../services/api'; 
import io from 'socket.io-client'; 

const SOCKET_URL = 'http://localhost:4000'; // URL Server Socket

// === TÁCH HEADERICONS VÀ NHẬN PROPS ===
const HeaderIcons = ({ unreadCount, onLogout }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user } = useAuth(); 
    
    // --- State Chat Mới Thêm ---
    const [isOpenChat, setIsOpenChat] = useState(false); 
    const [currentProject, setCurrentProject] = useState(null); 
    const [chatNotificationCount, setChatNotificationCount] = useState(0); 
    
    // Refs cho Chat
    const socketRef = useRef(null);
    const isOpenChatRef = useRef(isOpenChat);

    // 1. Lấy thông tin Org từ localStorage để check Plan
    const storedOrg = localStorage.getItem("organization");
    const currentOrg = storedOrg ? JSON.parse(storedOrg) : null;

    // 2. Logic check: Chỉ hiện nút nếu là Admin và đang dùng gói FREE
    const isFreeAdmin = user?.role === 'Admin' && currentOrg?.plan === 'FREE';

    const canManageRequests = ['Admin', 'Manager'].includes(user?.role);
    const showNavbarChat = user?.role === 'Manager' || user?.role === 'Member'; // Logic hiện chat

    const initials = user?.name
        ? user.name.split(" ").map(word => word[0]).join("").toUpperCase()
        : "??";

    // --- Đồng bộ Ref cho Chat ---
    useEffect(() => {
        isOpenChatRef.current = isOpenChat;
        if (isOpenChat) setChatNotificationCount(0);
    }, [isOpenChat]);

    // --- Lấy Project mặc định (Chạy ngầm) ---
    useEffect(() => {
        if (!showNavbarChat) return;

        const fetchProject = async () => {
            try {
                const res = await axiosInstance.get('/projects');
                if (res.data.success && res.data.data.length > 0) {
                    // Mặc định lấy project đầu tiên
                    setCurrentProject(res.data.data[0]);
                }
            } catch (err) {
                console.error("Error fetching projects for chat:", err);
            }
        };
        fetchProject();
    }, [showNavbarChat]);

    // --- Socket Connection ---
    useEffect(() => {
        if (!user || !currentProject) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        // Init socket nếu chưa có
        if (!socketRef.current || !socketRef.current.connected) {
            socketRef.current = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket'],
                reconnection: true,
            });
        }

        const socket = socketRef.current;

        const handleConnect = () => {
            if (currentProject?._id) socket.emit('join_project', currentProject._id);
        };

        const handleReceiveMessage = (msg) => {
            const myId = String(user._id || user.id);
            const senderId = String(msg.senderId?._id || msg.senderId);

            // Nếu người gửi khác mình VÀ chat đang đóng -> Tăng thông báo
            if (senderId !== myId && !isOpenChatRef.current) {
                setChatNotificationCount(prev => prev + 1);
            }
        };

        socket.off('connect', handleConnect);
        socket.off('receive_message', handleReceiveMessage);
        
        socket.on('connect', handleConnect);
        socket.on('receive_message', handleReceiveMessage);

        if (socket.connected) handleConnect();

        return () => {
            socket.off('connect', handleConnect);
            socket.off('receive_message', handleReceiveMessage);
        };
    }, [currentProject, user]);

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

    // Hàm toggle chat
    const toggleChat = () => {
        if (currentProject) {
            setIsOpenChat(prev => !prev);
        }
    };

    return (
        <div className="flex space-x-4 items-center">
            {/* BUTTON UPGRADE TO PREMIUM */}
            {isFreeAdmin && (
                <button
                    onClick={handleUpgrade}
                    className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#3b064d] to-[#f35640] text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                    <SparklesIcon className="w-4 h-4 text-yellow-200" />
                    <span>Upgrade Plan</span>
                </button>
            )}

            {/* --- BUTTON CHAT & BADGE --- */}
            {showNavbarChat && (
                <div className="relative">
                    <button 
                        onClick={toggleChat}
                        // Disable nếu chưa load xong project
                        disabled={!currentProject}
                        className={`relative p-2 rounded-full transition-all duration-300 
                            ${!currentProject ? 'opacity-50 cursor-wait' : 'opacity-100 cursor-pointer'}
                            ${isOpenChat ? 'bg-blue-50 text-[var(--color-brand)]' : 'text-gray-400 hover:text-[var(--color-brand)] hover:bg-gray-100'}
                        `}
                        title={currentProject ? `Chat: ${currentProject.name}` : "Loading chat..."}
                    >
                        <ChatBubbleLeftRightIcon className="w-6 h-6" />
                        
                        {/* Badge thông báo đỏ */}
                        {currentProject && !isOpenChat && chatNotificationCount > 0 && (
                            <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 z-10">
                                <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-sm animate-pulse">
                                    {chatNotificationCount > 99 ? '99+' : chatNotificationCount}
                                </span>
                            </div>
                        )}
                    </button>
                    
                    {/* Component ChatBox */}
                    {isOpenChat && currentProject && (
                        <ChatBox 
                            projectId={currentProject._id} 
                            projectName={currentProject.name} 
                            currentUser={user}
                            onClose={() => setIsOpenChat(false)} 
                        />
                    )}
                </div>
            )}

            {/* JOIN REQUEST BELL */}
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