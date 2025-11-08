import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideBar from '../components/SideBar';
import Navbar from '../components/NavBar'; 

const MainLayout = () => {
  const [headerData, setHeaderData] = useState({ title: '', subtitle: '' });
  const location = useLocation();

  useEffect(() => {
    // Xác định title và subtitle dựa trên pathname
    switch (location.pathname) {
      case '/tasks':
        setHeaderData({
          title: 'My Tasks',
          subtitle: 'Manage and track your assigned tasks across all projects'
        });
        break;
      case '/calendar':
        setHeaderData({
          title: 'Calendar',
          subtitle: 'View meetings and events by day'
        });
        break;
      case '/notifications':
        setHeaderData({
          title: 'Notifications',
          subtitle: 'View recent updates and mentions across your projects'
        });
        break;
      case '/settings':
        setHeaderData({
          title: 'Profile Settings',
          subtitle: 'Manage your account information and preferences'
        });
        break;
      case '/':
      default:
        setHeaderData({
          title: 'Dashboard',
          subtitle: 'Welcome to your dashboard'
        });
        break;
    }
  }, [location.pathname]); 

  return (
    <>
      <div className='flex h-screen'>
        <SideBar />
        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
          
          {/* Navbar sẽ nhận props từ state */}
          <Navbar 
            title={headerData.title} 
            subtitle={headerData.subtitle} 
          />

          {/* Sửa <main> để nó tự động nhận padding từ trang con */}
          <main className='flex-1'>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export default MainLayout;