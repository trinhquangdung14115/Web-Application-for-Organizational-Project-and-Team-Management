import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideBar from '../components/SideBar';
import Navbar from '../components/NavBar'; 
import { getProjects } from '../services/projectService';
import { getTasksByProject } from '../services/taskService';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { 
    ClipboardDocumentListIcon as TotalSolid, 
    ClockIcon as ClockSolid,
    ArrowPathIcon as ProgressSolid, 
    CheckCircleIcon as DoneSolid,
    ExclamationTriangleIcon as WarningSolid, 
} from '@heroicons/react/24/solid';
import { useAuth } from '../services/AuthContext';

const MainLayout = () => {
  const [headerData, setHeaderData] = useState({ title: '', subtitle: '' });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Lấy user từ Context

  // 🔴 UPDATE: Cập nhật màu chủ đạo theo yêu cầu mới
  // Admin: Màu riêng (#3b064d)
  // Member & Manager: Màu giống nhau (#f35640)
  useEffect(() => {
    const root = document.documentElement;
    if (user?.role === 'Admin') {
        // Admin Theme: Màu Tím Đậm (khớp với theme.css)
        root.style.setProperty('--color-brand', '#3b064d');
    } else {
        // Default Theme (Manager + Member): Màu Cam
        root.style.setProperty('--color-brand', '#f35640');
    }
  }, [user]); // Chạy lại mỗi khi user thay đổi

  useEffect(() => {
    const path = location.pathname;
  
    if (path === '/tasks') {
      setHeaderData({ title: 'Kanban Board', subtitle: 'Manage and track your assigned tasks' });
    } else if (path.startsWith('/tasks/')) {
      setHeaderData({ title: 'Task detail', subtitle: 'View and manage task details' });
    } else if (path === '/calendar') {
      setHeaderData({ title: 'Calendar', subtitle: 'View meetings and events' });
    } else if (path === '/members') {
      setHeaderData({ title: 'Team members', subtitle: 'Manage project members' });
    } else if (path === '/projects') {
      setHeaderData({ title: 'Test Workspace', subtitle: 'Manage all projects' });
    } else if (path === '/notifications') {
      setHeaderData({ title: 'Notifications', subtitle: 'View recent updates' });
    } else if (path === '/settings') {
      setHeaderData({ title: 'Profile Settings', subtitle: 'Manage your account' });
    } else {
      setHeaderData({ title: 'Dashboard', subtitle: 'You can check your working progress here' });
    }
  }, [location.pathname]);
  
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    const fetchDefaultData = async () => {
      try {
        const projects = await getProjects();
        if (projects && projects.length > 0) {
          const defaultProjectId = projects[0]._id;
          const apiTasks = await getTasksByProject(defaultProjectId);
          setTasks(apiTasks || []);
        }
      } catch (err) {
        console.error("Failed to load global data:", err);
      }
    };
    fetchDefaultData();
  }, []);
  
  const totalCount = tasks.length;
  const todoCount = tasks.filter(t => ['Todo', 'TODO'].includes(t.status)).length;
  const inProgressCount = tasks.filter(t => ['In Progress', 'DOING'].includes(t.status)).length;
  const doneCount = tasks.filter(t => ['Done', 'DONE'].includes(t.status)).length;
  
  const dueSoonCount = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      return (due - now > 0) && (due - now < 86400000); 
  }).length;

  const dynamicTasksSummary = [
    { number: totalCount, label: 'Total', icon: <TotalSolid />, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-800" },
    { number: todoCount, label: 'Todo', icon: <ClockSolid />, iconColor: "text-gray-500", bgColor: "bg-gray-100", textColor: "text-gray-600" },
    { number: inProgressCount, label: 'In Progress', icon: <ProgressSolid />, iconColor: "text-blue-500", bgColor: "bg-blue-100", textColor: "text-blue-600" },
    { number: doneCount, label: 'Done', icon: <DoneSolid />, iconColor: "text-green-500", bgColor: "bg-green-100", textColor: "text-green-600" },
    { number: dueSoonCount, label: 'Due soon', icon: <WarningSolid />, iconColor: "text-orange-500", bgColor: "bg-orange-100", textColor: "text-orange-600" },
  ];

  
  // Gọi hook polling 
  const { unreadCount } = useRealtimeNotifications(); 

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className='flex h-screen'>
        <SideBar unreadCount={unreadCount} />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          <Navbar 
            title={headerData.title} 
            subtitle={headerData.subtitle}
            unreadCount={unreadCount}
            onLogout={handleLogout}
          />
          <main className='flex-1'>
            <Outlet context={{ tasks, setTasks, dynamicTasksSummary }} /> 
          </main>
        </div>
      </div>
    </>
  );
}

export default MainLayout;