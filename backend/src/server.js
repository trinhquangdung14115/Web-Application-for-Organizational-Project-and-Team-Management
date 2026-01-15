import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import app from "./app.js";
import setupCronJobs from './services/cron.service.js';
import { setupSocket } from "./socket/chat.handler.js";
import { initSocket } from "./services/socket.service.js";

const PORT = process.env.PORT || 4000;

await connectDB();
setupCronJobs();
const httpServer = createServer(app);

const io = new Server(httpServer,{
  cors:{
    origin: process.env.NODE_ENV === "production" ? false: 
    ["http://localhost:5173", "http://localhost:4000"], 
    methods: ["GET", "POST"],
    credentials: true
  }
});

setupSocket(io); 
initSocket(io);
// 5. QUAN TRỌNG: Logic kết nối & Join Room cho Notification
io.on("connection", (socket) => {
  // Lấy userId từ query parameters (Frontend gửi lên: query: { userId: ... })
  const userId = socket.handshake.query.userId;

  if (userId) {
    // Cho user tham gia vào "phòng" riêng của họ
    socket.join(userId);
    console.log(`✅ User connected & joined room: ${userId}`);
  } else {
    console.log("⚠️ Socket connected without userId");
  }

  socket.on("disconnect", () => {
    // console.log("User disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
