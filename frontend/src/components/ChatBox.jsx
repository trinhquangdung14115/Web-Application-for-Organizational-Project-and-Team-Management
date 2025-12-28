import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // Import Portal
import { 
    XMarkIcon, 
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import io from 'socket.io-client';

const API_BASE_URL = 'http://localhost:4000/api';
const SOCKET_URL = 'http://localhost:4000';

const ChatBox = ({ projectId, projectName, onClose, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const inputRef = useRef(null);

    // --- Hàm kiểm tra chính xác người gửi (Xử lý cả _id và id) ---
    const checkIsMe = (senderId) => {
        if (!currentUser || !senderId) return false;
        
        // Lấy ID chuẩn dạng string để so sánh
        const currentUserId = String(currentUser._id || currentUser.id);
        const msgSenderId = String(senderId._id || senderId);

        return currentUserId === msgSenderId;
    };

    // --- Setup Socket & Fetch Data ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        socketRef.current = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        socketRef.current.emit('join_project', projectId);

        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/projects/${projectId}/messages?limit=50`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setMessages(data.data); 
                }
            } catch (err) {
                console.error("Failed to load messages", err);
            } finally {
                setIsLoading(false);
                scrollToBottom();
            }
        };

        fetchMessages();

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [projectId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (!socketRef.current || !socketRef.current.connected) {
            socketRef.current?.connect();
        }

        const messageData = {
            projectId,
            content: newMessage.trim(),
            type: 'TEXT'
        };

        socketRef.current.emit('send_message', messageData);
        setNewMessage('');
        inputRef.current?.focus();
    };

    // Sử dụng createPortal để đưa ChatBox ra ngoài body, thoát khỏi DOM của Navbar
    return createPortal(
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-[9999] animate-in slide-in-from-bottom-5 duration-300 font-sans">
            
            {/* --- HEADER --- */}
            <div 
                className="px-4 py-3 text-white rounded-t-2xl flex justify-between items-center shadow-sm"
                style={{ backgroundColor: 'var(--color-brand)' }}
            >
                <div>
                    <h3 className="font-bold text-sm truncate max-w-[200px]">{projectName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-xs opacity-90 font-medium">Live Chat</span>
                    </div>
                </div>
                {/* Nút Close */}
                <button 
                    onClick={onClose} 
                    className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* --- BODY --- */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div 
                            className="animate-spin rounded-full h-6 w-6 border-b-2"
                            style={{ borderColor: 'var(--color-brand)' }}
                        ></div>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="text-center text-gray-400 text-sm py-10 flex flex-col items-center">
                                <div className="bg-gray-100 p-3 rounded-full mb-2">
                                    <PaperAirplaneIcon className="w-6 h-6 text-gray-300" />
                                </div>
                                <p>No messages yet.</p>
                                <p className="text-xs mt-1">Start the conversation!</p>
                            </div>
                        )}
                        
                        {messages.map((msg, index) => {
                            const sender = msg.senderId || {}; // Fallback nếu sender null
                            const isMe = checkIsMe(sender);
                            
                            // Logic kiểm tra tin nhắn trước đó để gom nhóm (grouping)
                            const prevMsg = messages[index - 1];
                            const prevSenderId = prevMsg?.senderId?._id || prevMsg?.senderId;
                            const currentSenderId = sender._id || sender;
                            
                            // Chỉ hiện avatar nếu người gửi KHÁC người gửi tin nhắn trước đó
                            const isFirstInSequence = String(prevSenderId) !== String(currentSenderId);
                            const showAvatar = !isMe && isFirstInSequence;

                            return (
                                <div 
                                    key={msg._id || index} 
                                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group ${isFirstInSequence ? 'mt-3' : 'mt-1'}`}
                                >
                                    
                                    {/* --- AVATAR AREA (Bên trái) --- */}
                                    {!isMe && (
                                        <div className="w-8 h-8 shrink-0 flex flex-col justify-end">
                                            {showAvatar ? (
                                                sender.avatar ? (
                                                    <img 
                                                        src={sender.avatar} 
                                                        alt="avt" 
                                                        className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-sm"
                                                        onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} // Fallback nếu ảnh lỗi
                                                    />
                                                ) : (
                                                    // Fallback Avatar dạng chữ cái (Initials)
                                                    <div 
                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border bg-white shadow-sm"
                                                        style={{ color: 'var(--color-brand)', borderColor: 'var(--color-brand)' }}
                                                    >
                                                        {sender.name?.charAt(0).toUpperCase() || "?"}
                                                    </div>
                                                )
                                            ) : (
                                                // Khoảng trống giữ chỗ để text thẳng hàng
                                                <div className="w-8" />
                                            )} 
                                        </div>
                                    )}

                                    {/* --- MESSAGE CONTENT --- */}
                                    <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        
                                        {/* Tên người gửi (Chỉ hiện ở tin đầu tiên của nhóm) */}
                                        {!isMe && showAvatar && (
                                            <span className="text-[10px] text-gray-500 ml-1 mb-0.5 font-medium">
                                                {sender.name || "Unknown"}
                                            </span>
                                        )}

                                        {/* Bong bóng chat */}
                                        <div 
                                            className={`px-3 py-2 text-sm break-words shadow-sm transition-all ${
                                                isMe 
                                                    ? 'text-white rounded-2xl rounded-tr-sm' 
                                                    : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-sm'
                                            }`}
                                            style={isMe ? { backgroundColor: 'var(--color-brand)' } : {}}
                                        >
                                            {msg.content}
                                        </div>
                                        
                                        {/* Thời gian (Hiện khi hover) */}
                                        <span className={`text-[9px] text-gray-400 mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* --- FOOTER --- */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 rounded-b-2xl flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 text-sm text-gray-800 rounded-full px-4 py-2.5 border border-transparent focus:bg-white focus:outline-none transition-all focus:ring-2 focus:ring-offset-0"
                    style={{ '--tw-ring-color': 'var(--color-brand)' }}
                />
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className="p-2.5 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95 shadow-md"
                    style={{ backgroundColor: 'var(--color-brand)' }}
                >
                    <PaperAirplaneIcon className="w-5 h-5 -ml-0.5 mt-0.5 transform -rotate-45" />
                </button>
            </form>
        </div>,
        document.body // DOM node đích
    );
};

export default ChatBox;