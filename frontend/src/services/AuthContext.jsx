import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

// Định nghĩa URL API 
const API_URL = "http://localhost:4000/api"; 

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  // Hàm gọi API lấy User mới nhất (Được bọc useCallback để dùng ở nơi khác)
  const refreshUser = useCallback(async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (data.success) {
          setUser(data.data.user);
          localStorage.setItem("user", JSON.stringify(data.data.user));
          console.log("🔄 Auth Context: User data refreshed manually");
        }
      } catch (err) {
        console.error("Refresh user failed:", err);
      }
  }, []);

  // Gọi API lấy User mới nhất mỗi khi tải trang
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem("user");
      // 1. Hiển thị tạm dữ liệu cũ
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      
      await refreshUser(); // 2. Gọi API update
      setLoading(false);
    };

    initAuth();
  }, [refreshUser]);

  // Logic đổi theme class cho body (cho các style css global cũ)
  useEffect(() => {
    if (user && user.role === "Admin") {
      document.body.classList.add("admin-theme");
    } else {
      document.body.classList.remove("admin-theme");
    }
  }, [user]);

  const saveLogin = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData); // Cập nhật state ngay lập tức
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.body.classList.remove("admin-theme");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, saveLogin, logout, setUser, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);