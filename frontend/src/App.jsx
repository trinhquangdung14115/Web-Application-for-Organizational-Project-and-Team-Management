import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import Calendar from "./pages/Calendar.jsx";
import Notification from "./pages/Notification.jsx";
import Settings from "./pages/Settings.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import Members from "./pages/Members.jsx";
import Projects from "./pages/Projects.jsx";

// sau này thêm Dashboard, NotFound,...

function App() {
  return (
    <Routes>
      
      {/* trang mặc định */}
      <Route path="/" element={<Navigate to="/login" />} />

      {/* login */}
      <Route path="/login" element={<LoginPage />} />
      {/*signup*/}
      <Route path="/signup" element={<SignUpPage />} />

      {/*signup*/}
      <Route path="/signup" element={<SignUpPage />} />

      {/* home */}
      <Route path="/" element={<MainLayout />}>
        
        <Route path="home" element={<HomePage />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="notifications" element={<Notification />} />
        <Route path="settings" element={<Settings />} />
        <Route path="members" element={<Members />} />
        <Route path="projects" element={<Projects />} />

      </Route>

      {/* fallback 404 */}
      <Route path="*" element={<div>404 - Page not found</div>} />
    </Routes>
  );
}

export default App;