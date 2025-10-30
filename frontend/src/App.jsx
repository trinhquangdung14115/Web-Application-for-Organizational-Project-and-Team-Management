import { useState } from 'react'
import React from 'react'
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom'
import LoginPage from './components/LoginPage'
import MainLayout from './layouts/MainLayout'
const router = createBrowserRouter(
  createRoutesFromElements(
  <Route path='/login' element={<LoginPage />}/>
  
  )
);
const App = () => {
  return (
    <>
     <RouterProvider router={router} />
    </>
  )
}

export default App