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

const AdminLayout = () => {
  const [headerData, setHeaderData] = useState({ title: '', subtitle: '' });
  const location = useLocation();
  const navigate = useNavigate();
  // Lấy user + logout từ AuthContext
  const { user } = useAuth();

  useEffect(() => {
    const path = location.pathname;

    if (path === '/admin/tasks') {
      setHeaderData({
        title: 'Admin Tasks',
        subtitle: 'Manage and track your assigned tasks across all projects',
      });
    } else if (path.startsWith('/admin/tasks/')) {
      // TRANG CHI TIẾT TASK (admin)
      setHeaderData({
        title: 'Task detail',
        subtitle: 'View and manage the details of this task',
      });
    } else if (path === '/admin/calendar') {
      setHeaderData({
        title: 'Calendar',
        subtitle: 'View meetings and events by day',
      });
    } else if (path === '/admin/members') {
      setHeaderData({
        title: 'Team members',
        subtitle: 'Mange your projects team members and their roles',
      });
    } else if (path === '/admin/projects') {
      setHeaderData({
        title: 'Projects',
        subtitle: 'Manage all projects and their collaboration',
      });
    } else if (path === '/admin/notifications') {
      setHeaderData({
        title: 'Notifications',
        subtitle: 'View recent updates and mentions across your projects',
      });
    } else if (path === '/admin/settings') {
      setHeaderData({
        title: 'Profile Settings',
        subtitle: 'Manage your account information and preferences',
      });
    } else {
      // /admin/home hoặc mọi đường dẫn admin khác
      setHeaderData({
        title: 'Admin Dashboard',
        subtitle: 'Check your projects status and more',
      });
    }
  }, [location.pathname]);

  const [tasks, setTasks] = useState([]);
  // thêm useEffect để lấy dữ liệu thật 
  useEffect(() => {
    const fetchDefaultData = async () => {
      try {
        const projects = await getProjects();
        if (projects && projects.length > 0) {
          // Lấy tasks của dự án đầu tiên để hiển thị Global Summary
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

  // -- Summary cho MyTasks --
  // thêm kiểm tra status viết hoa/thường từ API
  const totalCount = tasks.length;
  const todoCount = tasks.filter(t => t.status === 'Todo' || t.status === 'TODO').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress' || t.status === 'DOING').length;
  const doneCount = tasks.filter(t => t.status === 'Done' || t.status === 'DONE').length;
  
  // Logic tính 'Due Soon' (1 ngày) dựa trên ngày hiện tại
  const dueSoonCount = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      const now = new Date();
      return (due - now > 0) && (due - now < 86400000); // 24h
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

  // Hàm Logout
  const handleLogout = () => {
    console.log("Logging out (UI-only)...");
    // ( sẽ xóa token ở đây)
    navigate('/login'); // Chuyển về trang login
  };

  return (
    <>
      <div className='flex h-screen'>
        <SideBar basePath="/admin" unreadCount={unreadCount} />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          
          {/* Navbar sẽ nhận props từ state */}
          <Navbar 
            title={headerData.title} 
            subtitle={headerData.subtitle}
            unreadCount={unreadCount}
            user={user}
            onLogout={handleLogout}
            
          />

          {/* Sửa <main> để nó tự động nhận padding từ trang con */}
          <main className='flex-1'>
            {/*  Truyền data xuống */}
            <Outlet context={{ 
              tasks, 
              setTasks, 
              dynamicTasksSummary
            }} /> 
          </main>
        </div>
      </div>
    </>
  );
}

export default AdminLayout;