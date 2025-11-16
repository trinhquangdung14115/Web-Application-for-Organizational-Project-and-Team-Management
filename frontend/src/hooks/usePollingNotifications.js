import { useState, useEffect } from 'react';
import { mockNotifications } from '../mocks/notifications'; 

// Đếm số lượng thông báo chưa đọc ban đầu từ file mock
const initialCount = mockNotifications.filter(n => n.unread).length; 

/**
 * Hook này mô phỏng việc nhận thông báo mới bằng cách
 * tự động tăng số đếm sau mỗi 'interval'.
 */
export const usePollingNotifications = (interval = 30000) => { 
    const [unreadCount, setUnreadCount] = useState(initialCount);

    useEffect(() => {
        // (Mô phỏng 1 thông báo mới mỗi 30 giây)
        const timer = setInterval(() => {
            // Tăng số đếm lên 1
            setUnreadCount(count => count + 1);
        }, interval);

        // Dọn dẹp khi component bị hủy
        return () => clearInterval(timer);
    }, [interval]);

    return { unreadCount };
};