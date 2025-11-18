import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google'; // THÊM IMPORT NÀY
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./services/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <React.StrictMode>
      <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>  
      </BrowserRouter>
    </React.StrictMode>
  </GoogleOAuthProvider>
);

console.log("DEBUG CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);