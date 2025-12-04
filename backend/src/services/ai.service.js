import { GoogleGenerativeAI } from "@google/generative-ai";
import Bottleneck from "bottleneck";
import dotenv from "dotenv";

dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAi.getGenerativeModel({model: "gemini-2.0-flash"});

// Rate limit 4s mới cho gọi 1 lần
const limiter = new Bottleneck({
  minTime: 4000,      // Cách nhau tối thiểu 4000ms (4s)
  maxConcurrent: 1,   // xử lý từng cái một để tránh tắc nghẽn
});

limiter.on("failed", async (error, jobInfo)=> {
    console.warn('Job ${id} failed ${error.message}$');
    if (jobInfo.retryCount < 3){
        console.log('Retry Job ${id}$');
        return 2000;
        
    }
});

class AIService{
    //Task 1 subtask >.<
    static async generateSubtasks(taskTitle) {
    // Bọc hàm gọi API vào limiter
    return limiter.schedule(async () => {
      try {
        console.log(`AI Generating subtasks for: "${taskTitle}"...`);

        // Prompt Template 
        const prompt = `
          You are a strict task management assistant.
          Action: Break down the task "${taskTitle}" into 3 to 5 small actionable steps.
          
          OUTPUT RULES (Strictly Follow):
          1. Language: English.
          2. Format: A raw JSON Array of strings.
          3. Content style: "Step 1: [Action]", "Step 2: [Action]".
          4. NO Markdown, NO explanations, NO code blocks (like \`\`\`json).
          5. Return ONLY the Array.

          Example Output:
          ["Step 1: Research competitor apps",
            "Step 2: Sketch initial UI wireframes", 
            "Step 3: Define database schema"]
        `;

        // Gọi API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Xóa markdown ```json ... ```, xóa khoảng trắng thừa
        text = text.replace(/```json|```/g, '').trim();
        // Xóa các ký tự lạ nếu có
        text = text.replace(/^'|'$/g, ''); 

        // Parse JSON
        try {
          const subtasks = JSON.parse(text);
          
          // Kiểm tra xem có phải là mảng không
          if (!Array.isArray(subtasks)) {
            throw new Error("AI response is not an array");
          }
          return subtasks;

        } catch (parseError) {
          console.error(" JSON Parse Error:", parseError);
          // Fallback: Nếu AI trả về text thường, cố gắng tách dòng thủ công
          return text.split("\n").filter(line => line.length > 0);
        }

      } catch (error) {
        console.error("AI Service Error (Subtasks):", error.message);
        // Trả về mảng rỗng để không crash BE/FE
        return [];
      }
    });
  }

  // Cái này cho summarize hằng ngày
  static async summarizeDay(tasks = [], meetings = []) {
    return limiter.schedule(async () => {
      try {
        console.log(`AI Summarizing day (JSON mode)...`);

        // 1. Chuẩn bị dữ liệu đầu vào (Kèm Labels)
        const taskList = tasks.length > 0 
          ? tasks.slice(0, 15).map(t => `- Title: "${t.title}" | Status: ${t.status} | Labels: ${t.labels?.join(', ') || 'None'}`).join("\n") 
          : "No tasks today.";
          
        const meetingList = meetings.length > 0 
          ? meetings.map(m => `- ${m.title} @ ${m.time}`).join("\n") 
          : "No meetings today.";

        // 2. Prompt Engineering (Force JSON Structure)
        const prompt = `
          Act as a professional personal assistant.
          Analyze the following data for today:
          
          TASKS:
          ${taskList}
          
          MEETINGS:
          ${meetingList}

          Action: Generate a daily briefing in strict JSON format.
          Language: English.
          
          OUTPUT JSON STRUCTURE:
          {
            "greeting": "A short summary sentence stating how many tasks and meetings user has (e.g., 'You have 3 tasks and 1 meeting today.')",
            "task_highlights": [
              {
                "title": "Task Title",
                "label": "First label found or 'General'",
                "summary": "A very short 1-sentence prediction of what needs to be done based on the title."
              }
            ],
            "upcoming_meetings": [
              { "title": "Meeting Name", "time": "Time" }
            ],
            "encouragement": "A short, professional motivating sentence."
          }

          RULES:
          1. Return ONLY the JSON object. No futher explaination after the response.
          2. No Markdown blocks (no \`\`\`json).
          3. If no tasks/meetings, return empty arrays but keep the structure.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // 3. Vệ sinh dữ liệu
        text = text.replace(/```json|```/g, '').trim();

        // 4. Parse JSON
        return JSON.parse(text);

      } catch (error) {
        console.error("AI Service Error (Summary):", error.message);
        // Fallback data nếu AI lỗi để FE không trắng trang
        return {
            greeting: "System is busy.",
            task_highlights: [],
            upcoming_meetings: [],
            encouragement: "Please try again!"
        };
      }
    });
  }
  
}
export default AIService;