import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const axiosInstance = axios.create({
  baseURL: `${API}`, 
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
