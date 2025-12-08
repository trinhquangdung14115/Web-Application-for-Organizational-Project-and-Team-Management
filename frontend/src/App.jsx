import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import MyTasks from "./pages/MyTasks.jsx";
import TaskDetail from "./pages/TaskDetail.jsx";
import Calendar from "./pages/Calendar.jsx";
import Notification from "./pages/Notification.jsx";
import Settings from "./pages/Settings.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import Members from "./pages/Members.jsx";
import Projects from "./pages/Projects.jsx";
import AdminLayout from "./layouts/AdminLayout";
import AppRouter from "./routes/AppRouter.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";

// sau này thêm Dashboard, NotFound,...

function App() {
  return (
    <Routes>
      
      {/* trang mặc định */}
      <Route path="/" element={<LandingPage />} />

      {/* login */}
      <Route path="/login" element={<LoginPage />} />
      {/*signup*/}
      <Route path="/signup" element={<SignUpPage />} />
      {/* payment success */}
      <Route path="/payment/success" element={<PaymentSuccess />} />
      {/* pricing */}
      <Route path="/pricing" element={<PricingPage />} />

      {/* user */}
      <Route path="" element={<AppRouter requiredRole={["Member", "Manager"]}> <MainLayout /> </AppRouter> }>
        
        <Route path="/home" element={<HomePage />} />
        <Route path="/tasks" element={<MyTasks />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/notifications" element={<Notification />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/members" element={<Members />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<Projects />} />
        <Route path="/projects/:projectId/home" element={<HomePage />} />

      </Route>
      {/* admin */}
      <Route path="/admin" element={<AppRouter requiredRole={["Admin"]}> <AdminLayout /> </AppRouter> }>
        
        <Route path="home" element={<HomePage />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="tasks/:taskId" element={<TaskDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="notifications" element={<Notification />} />
        <Route path="settings" element={<Settings />} />
        <Route path="members" element={<Members />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:projectId" element={<Projects />} />
        <Route path="projects/:projectId/home" element={<HomePage />} />

      </Route>


      {/* fallback 404 */}
      <Route path="*" element={<div>404 - Page not found</div>} />
    </Routes>
  );
}

export default App;