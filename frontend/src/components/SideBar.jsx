import React from 'react'
import logo from '../assets/images/syncora.png'
const SideBar = () => {
  return (
    <>
    <div className='w-64 bg-white border-r h-screen flex flex-col' >
        {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-7 border-b">
        <a className='flex items-center' href='/index.html'>
        <img
        className="h-10 w-auto"
        src={ logo }
        />
        </a>
      </div>

    </div>
    </>
  )
}

export default SideBar