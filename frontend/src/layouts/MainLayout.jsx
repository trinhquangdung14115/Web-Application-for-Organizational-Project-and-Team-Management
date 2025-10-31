import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from '../components/SideBar'
import Navbar from '../components/Navbar'
const MainLayout = () => {
  return (
    <>
    <div className='flex h-screen'>
        <SideBar/>
        <div className="flex-1  flex flex-col  bg-gray-50">
            <Navbar/>
            <main className='flex p-6'>
                <Outlet/>
            </main>
        </div>
    </div>
    </>
  )
}

export default MainLayout