import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./services/AuthContext.jsx";
import { ProjectProvider } from "./context/ProjectContext.jsx"; 
import { NotificationProvider } from "./context/NotificationContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <React.StrictMode>
      <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
        {/*  */}
        <ProjectProvider>
            <App />
        </ProjectProvider>
        </NotificationProvider>
        {/* ==================================== */}
      </AuthProvider>  
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
);