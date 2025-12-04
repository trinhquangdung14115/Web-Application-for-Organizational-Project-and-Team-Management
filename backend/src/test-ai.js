// backend/src/test-ai.js
import AIService from "./services/ai.service.js";
import dotenv from "dotenv";

// Load biến môi trường để lấy GEMINI_API_KEY
dotenv.config();

const runTest = async () => {
  console.log("BẮT ĐẦU TEST AI SERVICE (JSON MODE)...\n");

  // --- TEST CASE 1: SUBTASKS (Giữ nguyên để test 1 thể) ---
  const taskTitle = "Tổ chức tiệc tất niên công ty";
  console.log(`1.Đang test Generate Subtasks cho: "${taskTitle}"...`);
  
  try {
    const subtasks = await AIService.generateSubtasks(taskTitle);
    console.log("Kết quả Subtasks (Array):");
    console.log(JSON.stringify(subtasks, null, 2));
  } catch (err) {
    console.error("Lỗi Subtasks:", err.message);
  }
  
  console.log("\n--------------------------------------------------\n");

  // --- TEST CASE 2: SUMMARIZE DAY (Cấu trúc JSON mới) ---
  console.log("2.Đang test Summarize Day (English JSON Output)...");
  
  // Giả lập dữ liệu Task (Có Label để AI phân tích kỹ hơn)
  const mockTasks = [
    { 
      title: "Fix Stripe Webhook 404 Error", 
      status: "DOING", 
      labels: ["Bug", "Urgent"] 
    },
    { 
      title: "Design Homepage UI", 
      status: "TODO", 
      labels: ["UI/UX", "Design"] 
    },
    { 
      title: "Setup MongoDB Atlas", 
      status: "DONE", 
      labels: ["Backend", "Database"] 
    }
  ];
  
  // Giả lập dữ liệu Meeting
  const mockMeetings = [
    { title: "Daily Scrum with Team", time: "09:00 AM" },
    { title: "Demo Product with Client", time: "02:00 PM" }
  ];

  try {
    const summary = await AIService.summarizeDay(mockTasks, mockMeetings);
    
    console.log("Kết quả Summary (JSON Object):");
    console.log(JSON.stringify(summary, null, 2)); // In format đẹp để dễ nhìn cấu trúc

    // Kiểm tra nhanh cấu trúc
    if (summary.greeting && Array.isArray(summary.task_highlights)) {
        console.log("\nTest Passed: Cấu trúc JSON trả về chuẩn!");
    } else {
        console.warn("\nTest Warning: Cấu trúc JSON có vẻ thiếu trường.");
    }

  } catch (err) {
    console.error("Lỗi Summary:", err.message);
  }
  
  console.log("\n--------------------------------------------------");
};

// Chạy hàm test
runTest();