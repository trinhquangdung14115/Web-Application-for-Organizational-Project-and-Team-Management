import { verifyJwt } from "../utils/jwt.js"; // Helper có sẵn trong project
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { initSocket } from "../services/socket.service.js"; 
export const setupSocket = (io) => {
  
  // Middleware: Xác thực Token trước khi cho kết nối
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      if (!token) return next(new Error("Authentication error"));

      // Loại bỏ "Bearer " 
      const cleanToken = token.startsWith("Bearer ") ? token.slice(7) : token;
      
      const decoded = verifyJwt(cleanToken);
      if (!decoded) return next(new Error("Invalid token"));

      // Lưu thông tin user vào socket session để dùng sau
      socket.user = { _id: decoded.sub, role: decoded.role };
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id} | UserID: ${socket.user._id}`);

    socket.join(userId);
    
    // Join vào phòng Chat của Project
    socket.on("join_project", (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.user._id} joined project room: ${projectId}`);
    });

    // Gửi tin nhắn
    socket.on("send_message", async (data) => {
      try {
        const { projectId, content } = data;

        if (!content || !projectId) return;

        // Lưu vào Database 
        const newMessage = await Message.create({
          projectId,
          senderId: socket.user._id,
          content,
          type: "TEXT" 
        });

        // Populate thông tin người gửi (Avatar, Tên)
        const populatedMessage = await newMessage.populate("senderId", "name avatar");

        // Gửi lại tin nhắn cho TẤT CẢ mọi người trong phòng (bao gồm cả người gửi)
        io.to(projectId).emit("receive_message", populatedMessage);

      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    //  Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};