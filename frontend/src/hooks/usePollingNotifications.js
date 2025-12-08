import { useState, useEffect, useCallback } from 'react';

// Cấu hình URL backend (Bạn kiểm tra xem port 4000 hay 5000 nhé)
const API_URL = 'http://localhost:4000/api'; 

export const usePollingNotifications = (intervalMs = 30000) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- Lấy Token từ LocalStorage (Sửa 'accessToken' nếu bạn lưu tên khác) ---
    const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

    // --- 1. Gọi API Lấy danh sách ---
    const fetchData = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return; 

            const response = await fetch(`${API_URL}/notifications`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) return; // Nếu lỗi mạng thì bỏ qua, đợi lần poll sau

            const json = await response.json();
            // Backend trả về { success: true, data: [...] }
            // Luôn đảm bảo data là mảng để không bị lỗi .filter
            setNotifications(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
            console.error("Polling error:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // --- 2. Cơ chế Polling (30s gọi 1 lần) ---
    useEffect(() => {
        fetchData(); // Gọi ngay khi mới vào web
        const interval = setInterval(fetchData, intervalMs); // Hẹn giờ lặp lại
        return () => clearInterval(interval); // Dọn dẹp khi tắt component
    }, [fetchData, intervalMs]);

    // --- 3. Đánh dấu đã đọc ---
    const markAsRead = async (notificationId) => {
        // Cập nhật giao diện ngay lập tức (Optimistic UI)
        setNotifications(prev => prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
        ));

        // Gọi API ngầm
        try {
            const token = getToken();
            await fetch(`${API_URL}/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error("Mark read failed", error);
        }
    };

    // Tính số lượng chưa đọc an toàn
    const unreadCount = Array.isArray(notifications) 
        ? notifications.filter(n => !n.read).length 
        : 0;

    return { notifications, unreadCount, markAsRead, isLoading };
};