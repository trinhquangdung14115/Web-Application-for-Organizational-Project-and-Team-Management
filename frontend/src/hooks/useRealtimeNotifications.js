import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../services/AuthContext'; // Giả sử bạn có AuthContext để lấy user
import { API_BASE_URL } from '../utils/constants';

// URL Backend (Đảm bảo đúng port server đang chạy, ví dụ 4000)
const SOCKET_URL = 'http://localhost:4000';

export const useRealtimeNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Ref để giữ socket connection tránh tạo lại liên tục
    const socketRef = useRef(null);

    // Helper: Lấy token
    const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

    // --- 1. Initial Load: Lấy danh sách cũ từ API (Giữ nguyên logic cũ) ---
    const fetchNotifications = useCallback(async () => {
        try {
            const token = getToken();
            if (!token || !user) return;

            const response = await fetch(`${API_BASE_URL}/notifications?limit=20`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const json = await response.json();
                const data = Array.isArray(json.data) ? json.data : [];
                setNotifications(data);
                
                // Cập nhật số lượng chưa đọc từ API (hoặc tự đếm)
                // Backend trả về json.unreadCount trong file notification.controller.js
                if (typeof json.unreadCount === 'number') {
                    setUnreadCount(json.unreadCount);
                } else {
                    setUnreadCount(data.filter(n => !n.read).length);
                }
            }
        } catch (err) {
            console.error("Initial notification load error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // --- 2. Socket: Lắng nghe sự kiện Realtime (Thay thế Polling) ---
    useEffect(() => {
        if (!user) return;

        // Fetch dữ liệu lần đầu khi mount
        fetchNotifications();

        // Khởi tạo Socket
        const token = getToken();
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            // Gửi token hoặc userId để server xác thực room
            auth: { token }, 
            query: { userId: user._id } 
        });

        // Lắng nghe sự kiện "NEW_NOTIFICATION" từ notification.service.js
        socketRef.current.on("NEW_NOTIFICATION", (newNotification) => {
            console.log("🔔 New Realtime Notification:", newNotification);

            // 1. Thêm thông báo mới vào đầu danh sách
            setNotifications((prev) => [newNotification, ...prev]);

            // 2. Tăng số lượng chưa đọc
            setUnreadCount((prev) => prev + 1);

            // (Tuỳ chọn) Có thể thêm âm thanh hoặc Toast tại đây
            // const audio = new Audio('/notification-sound.mp3');
            // audio.play();
        });

        // Cleanup: Ngắt kết nối khi unmount để tránh memory leak và duplicate event
        return () => {
            if (socketRef.current) {
                socketRef.current.off("NEW_NOTIFICATION");
                socketRef.current.disconnect();
            }
        };
    }, [user, fetchNotifications]);

    // --- 3. Hành động: Đánh dấu đã đọc ---
    const markAsRead = async (notificationId) => {
        // Optimistic UI: Cập nhật giao diện ngay lập tức
        let isWasUnread = false;
        
        setNotifications(prev => prev.map(n => {
            if (n._id === notificationId) {
                if (!n.read) isWasUnread = true;
                return { ...n, read: true };
            }
            return n;
        }));

        // Nếu thông báo đó chưa đọc, giảm counter đi 1
        if (isWasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // Gọi API ngầm
        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error("Mark read failed", error);
            // Có thể rollback state nếu cần thiết
        }
    };

    // --- 4. Hành động: Đánh dấu tất cả đã đọc ---
    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PATCH', // Chú ý: Backend cần có route này (đã thấy trong notification.controller.js)
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error("Mark all read failed", error);
        }
    };

    return { 
        notifications, 
        unreadCount, 
        isLoading, 
        markAsRead, 
        markAllAsRead,
        refresh: fetchNotifications // Cho phép gọi lại thủ công nếu cần
    };
};