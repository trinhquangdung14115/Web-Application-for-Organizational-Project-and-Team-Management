import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../services/AuthContext';
import { API_BASE_URL } from '../utils/constants';

const NotificationContext = createContext();

const SOCKET_URL = 'http://localhost:4000';

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

    // 1. Fetch dữ liệu lần đầu
    const fetchNotifications = useCallback(async () => {
        try {
            const token = getToken();
            if (!token || !user) return;

            const response = await fetch(`${API_BASE_URL}/notifications?limit=20`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const json = await response.json();
                const data = Array.isArray(json.data) ? json.data : [];
                setNotifications(data);
                
                // Cập nhật số lượng chưa đọc chính xác từ server hoặc đếm thủ công
                if (typeof json.unreadCount === 'number') {
                    setUnreadCount(json.unreadCount);
                } else {
                    setUnreadCount(data.filter(n => !n.read).length);
                }
            }
        } catch (err) {
            console.error("Fetch noti error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // 2. Kết nối Socket & Lắng nghe Realtime
    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        const token = getToken();
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: { token },
            query: { userId: user._id }
        });

        socketRef.current.on("NEW_NOTIFICATION", (newNoti) => {
            setNotifications(prev => [newNoti, ...prev]);
            setUnreadCount(prev => prev + 1);
            // Có thể thêm âm thanh ting ting ở đây
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [user, fetchNotifications]);

    // 3. Mark As Read (Cập nhật ngay lập tức cho TẤT CẢ nơi dùng context)
    const markAsRead = async (id) => {
        // Tìm xem thông báo này có đang unread không
        const target = notifications.find(n => n._id === id);
        if (target && target.read) return; // Đã đọc rồi thì thôi

        // Optimistic Update: Cập nhật giao diện ngay lập tức
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
        } catch (error) { console.error(error); }
    };

    // 4. Mark All Read
    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
        } catch (error) { console.error(error); }
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, 
            unreadCount, 
            isLoading, 
            markAsRead, 
            markAllAsRead,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);