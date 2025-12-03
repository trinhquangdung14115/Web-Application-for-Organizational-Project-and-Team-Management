import cron from 'node-cron';
import Task from '../models/task.model.js';
import Notification from '../models/notification.model.js';

const setupCronJobs = () => {
  // 1. Quét Task quá hạn (Chạy lúc 00:00 hàng ngày)
  // Cú pháp: Phút(0) Giờ(0) Ngày(*) Tháng(*) Thứ(*)
  cron.schedule('0 0 * * *', async () => {
    console.log('--- Daily Job: Starting Overdue Task Scan ---');
    
    try {
      const now = new Date();

      // Tìm các task quá hạn, chưa xong và chưa báo
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $ne: 'DONE' },
        isOverdueNotified: false,
        deletedAt: null
      }).populate('assigneeId', 'name email');

      if (overdueTasks.length > 0) {
        console.log(`Found ${overdueTasks.length} overdue tasks. Processing...`);

        for (const task of overdueTasks) {
           // A. Tạo Notification thật vào DB
           if (task.assigneeId) {
             await Notification.create({
               userId: task.assigneeId._id,
               title: "Task Overdue Alert",
               message: `Task "${task.title}" was due on ${new Date(task.dueDate).toLocaleDateString()}.`,
               type: "WARNING",
               isRead: false
             });
           }

           // B. Update cờ để không báo lại nữa
           task.isOverdueNotified = true;
           await task.save();
           console.log(` -> Sent notification for task: "${task.title}"`);
        }
      } else {
        console.log('No overdue tasks found today.');
      }

    } catch (error) {
      console.error("Cron Job Error:", error);
    }
    console.log('--- Daily Scan Finished ---\n');
  }, {
    timezone: "Asia/Ho_Chi_Minh" // chạy đúng 0h00 giờ VN
  });

  // 2. Auto Checkout (Chạy lúc 23:00 hàng ngày)
  cron.schedule('0 23 * * *', async () => { 
      console.log('--- 🌙 Auto checkout running ---'); 
      // Logic auto checkout...
  }, {
    timezone: "Asia/Ho_Chi_Minh"
  });
};

export default setupCronJobs;