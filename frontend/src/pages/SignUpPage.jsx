import React from 'react'
import logo from '../assets/images/syncora.png'
import tag from '../assets/images/logo.png'
import { Mail, Lock, Building, Phone, User } from "lucide-react";

const SignUpPage = () => {
  return (
    <>
    <section className="bg-background bg-center bg-cover min-h-screen flex items-center justify-center  relative">
  
  <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center " style={{
      WebkitBackdropFilter: "blur(30px) saturate(150%)",
      backdropFilter: "blur(30px) saturate(150%)",
    }}>
  
    <div className="w-full px-8 md:px-10 ">
      <h2 className="font-bold font-sans text-2xl text-gray-100  justify-center flex items-center space-x-2"><span>Welcome to </span><span className="text-brand">Syncora</span></h2>
      <p className=" text-gray-200 mt-4 mb-4 flex items-center justify-center text-center ">Join thousands of teams already using Syncora to streamline their workflow</p>

      <form action="" className="flex flex-col gap-4">
        {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">First Name</label>
              <input
                type="text"
                placeholder="First Name"
                className="w-full border rounded-lg p-2 focus:ring-2 focus-within:ring-brand focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Last Name</label>
              <input
                type="text"
                placeholder="Last Name"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Phone Number</label>
            <div className="flex border rounded-lg focus-within:ring-2 focus-within:ring-brand overflow-hidden">
              <select className="bg-gray-100 text-gray-700 px-2 py-2 focus:outline-none border-none rounded-none">
                <option>+1</option>
                <option>+84</option>
                <option>+44</option>
              </select>
              <input
                type="tel"
                placeholder="0123456789"
                className="w-full p-2  focus:outline-none border-none rounded-none"
              />
            </div>
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Organization</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Acme Inc"
                className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="w-full border rounded-lg p-2 pl-9 focus:ring-2 focus:ring-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full font-medium bg-brand rounded-xl text-white py-2 hover:scale-105 duration-300"
          >
            Create My Account
          </button>
      </form>
      

      <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
        <hr className="border-gray-400"/>
        <p className="text-center text-sm">OR</p>
        <hr className="border-gray-400"/>
      </div>

      <button className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 duration-300 ">
        {/* {logo google} */}
        <svg className="mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Signup with Google
      </button>


      <p className="text-center text-white mt-6 text-sm">
          Already have an account?{" "}
          <a href="/" className="text-brand font-medium hover:underline">
            Sign in
          </a>
        </p>
      </div>    
  </div>
  <img src={tag} alt="logo" className="absolute  top-1 right-1  w-40 h-auto" />
</section>  
    </>
  )
}

export default SignUpPage