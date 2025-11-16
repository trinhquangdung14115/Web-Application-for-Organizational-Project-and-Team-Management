export const mockNotifications = [
    { id: 1, type: 'assigned', project: 'Website Redesign', task: 'Design Homepage', sender: 'Sarah Chen', time: '2h ago', unread: true, avatarUrl: null },
    { id: 2, type: 'mention', project: 'API Integration', task: 'N/A', sender: 'Michael Brown', time: '4h ago', unread: true, avatarUrl: null },
    { id: 3, type: 'due_soon', project: 'N/A', task: 'API Documentation', sender: 'System', time: '5h ago', unread: true, avatarUrl: null },
    { id: 4, type: 'completed', project: 'Backend Development', task: 'Database Migration', sender: 'Emily Zhang', time: 'Yesterday', unread: false, avatarUrl: null },
    { id: 5, type: 'comment', project: 'N/A', task: 'User Authentication', sender: 'James Wilson', time: 'Yesterday', unread: false, avatarUrl: null },
    { id: 6, type: 'assigned', project: 'Mobile Development', task: 'Mobile App Testing', sender: 'Maria Garcia', time: '2 days ago', unread: false, avatarUrl: null },
    // Thêm một vài thông báo chưa đọc để test polling
    { id: 7, type: 'mention', project: 'Marketing', task: 'N/A', sender: 'John Doe', time: '1 min ago', unread: true, avatarUrl: null },
];