import React from 'react'
import logo from '../assets/images/syncora.png'
import tag from '../assets/images/logo.png'

const LoginPage = () => {
  return (
    <>
    <section className="bg-background2 bg-center bg-cover min-h-screen flex items-center justify-end  pr-32  relative text-white">
     {/* QUOTE SECTION */}
  <div className="absolute left-20 max-w-xl">
    <h1 className="text-6xl font-bold leading-tight drop-shadow-lg">
      “The best way to predict the future is to create it.”
    </h1>
    <p className="mt-6 text-lg text-gray-200 italic drop-shadow-md">
      — Tom Ca Chua - 2025
    </p>
  </div>
  <div className="backdrop-blur-[30px] bg-white/20 border border-white/30 flex rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.37)] w-[500px] p-5 items-center justify-center " style={{
      WebkitBackdropFilter: "blur(30px) saturate(150%)",
      backdropFilter: "blur(30px) saturate(150%)",
    }}>
  
    <div className="w-full px-8 md:px-10 ">
      <h2 className="font-bold font-sans text-2xl text-gray-600  justify-center flex items-center">Welcome Back</h2>
      <p className=" text-gray-500 mt-4 mb-4 flex items-center justify-center ">Sign in to continue your work</p>

      <form action="" className="flex flex-col gap-4">
        <label className="block text-gray-200 text-sm  mt-1">Email address</label>
        <input className="p-2  rounded-xl border" type="email" name="email" placeholder="Enter your Email"/>
        <div className="relative">
            <label className="block text-gray-200 text-sm mb-2 mt-1">Password</label>
          <input className="p-2 rounded-xl border w-full" type="password" name="password" placeholder="Enter your Password"/>
        </div>
        <div className="text-right ">
            <a href="/" className="text-sm  text-brand hover:underline   ">
              Forgot Password?
            </a>
          </div>
        <button className="bg-brand rounded-xl font-medium text-white py-2 hover:scale-105 duration-300">Login</button>
      </form>
      

      <div className="mt-6 grid grid-cols-3 items-center text-gray-400">
        <hr className="border-gray-400"/>
        <p className="text-center text-sm">OR</p>
        <hr className="border-gray-400"/>
      </div>

      <button className="bg-white border py-2 w-full rounded-xl mt-5 flex justify-center items-center text-sm hover:scale-105 duration-300 text-black ">
        {/* {logo google} */}
        <svg className="mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="25px">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Continue with Google
      </button>


      <p className="text-center text-white mt-6 text-sm">
          Don’t have an account?{" "}
          <a href="/signup" className="text-brand font-medium hover:underline">
            Sign Up
          </a>
        </p>
      </div>    
  </div>
  <img src={tag} alt="logo" className="absolute  top-1 right-1  w-40 h-auto" />
</section>  
    </>
  )
}

export default LoginPage