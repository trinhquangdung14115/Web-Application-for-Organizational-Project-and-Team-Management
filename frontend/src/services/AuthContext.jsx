import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Load từ localStorage khi refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  //  1. Logic đổi theme mỗi khi user thay đổi
  useEffect(() => {
    if (user && user.role === "Admin") {
      document.body.classList.add("admin-theme");
    } else {
      document.body.classList.remove("admin-theme");
    }
  }, [user]); //  chạy mỗi khi user login/logout


  const saveLogin = (userData, token) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setUser(userData);  //  React state → mọi component cập nhật ngay
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    document.body.classList.remove("admin-theme");
    setUser(null); //  Re-render toàn app
  };

  return (
    <AuthContext.Provider value={{ user, saveLogin, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);