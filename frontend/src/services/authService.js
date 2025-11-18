import axiosInstance from "./api";

// Đăng ký người dùng mới
export const signup = async (name, email, password) => {
  try {
    const response = await axiosInstance.post("/auth/signup", {
      name,
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      // Thêm token vào header cho các request sau
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: { message: "Login failed. Please try again!" } };
  }
};

// Đăng nhập
export const login = async (email, password) => {
  try {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      // Thêm token vào header cho các request sau
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`;
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { error: { message: "Invalid email or password!" } };
  }
};

// Lấy thông tin user hiện tại
export const getMe = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    
    // Thêm token vào header
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    
    const response = await axiosInstance.get("/auth/me");
    return response.data.user;
  } catch (error) {
    console.error("Error fetching user info:", error);
    // Nếu lỗi 401  thì xóa token cũ
    if (error.response?.status === 401) {
      logout();
    }
    return null; // Nếu lỗi 401 thì xóa token và trả về null
  }
};

// Đăng xuất
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  delete axiosInstance.defaults.headers.common["Authorization"];
};

// Lấy thông tin user từ localStorage
export const getStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// Lấy token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Kiểm tra đã đăng nhập chưa
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

// Khởi tạo token nếu có
export const initAuth = () => {
  const token = getToken();
  if (token) {
    axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

// Gọi hàm khởi tạo khi load module
initAuth();