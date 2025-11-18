import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// (Request Interceptor)
axiosInstance.interceptors.request.use(
  (config) => {
    // Tự động lấy token từ kho và gắn vào mỗi request
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosInstance.interceptors.response.use(
  (response) => {
    return response; 
  },
  (error) => {
    // Nếu Backend trả về 401 (Hết hạn hoặc Fake Token)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // về trang login 
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
export default axiosInstance;