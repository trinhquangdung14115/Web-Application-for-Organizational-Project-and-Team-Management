import cron from 'node-cron';
import Task from '../models/task.model.js';
import Notification from '../models/notification.model.js';

const setupCronJobs = () => {
  // Run every minute
  cron.schedule('*/1 * * * *', async () => {
    console.log('--- Starting Overdue Task Scan ---');
    
    try {
      // 1. Check total tasks in DB
      const totalTasks = await Task.countDocuments();
      console.log(`Total tasks in DB 'test': ${totalTasks}`);

      if (totalTasks === 0) {
        console.log("DB is empty- connected to a database with no data.");
        return;
      }

      const now = new Date();
      
      // 2. Log a sample task to verify structure
      const sampleTask = await Task.findOne();
      console.log('Sample task found:', {
          id: sampleTask._id,
          title: sampleTask.title,
          dueDate: sampleTask.dueDate,
          isOverdueNotified: sampleTask.isOverdueNotified, // Important: Check if field exists
          status: sampleTask.status
      });

      // 3. Execute query for overdue tasks
      const overdueTasks = await Task.find({
        dueDate: { $lt: now },
        status: { $ne: 'DONE' },
        isOverdueNotified: false,
        deletedAt: null
      }).populate('assigneeId', 'name email');

      console.log(`Search Result: Found ${overdueTasks.length} overdue tasks.`);

      if (overdueTasks.length > 0) {
        for (const task of overdueTasks) {
           // Simulate sending notification
           console.log(`Sending notification for task: "${task.title}"`);
           
           // Update task status
           task.isOverdueNotified = true;
           await task.save();
           console.log('Updated isOverdueNotified = true');
        }
      }

    } catch (error) {
      console.error("Cron Job Error:", error);
    }
    console.log('--- Scan Finished ---\n');
  });

  // Job 2 (Auto checkout)
  cron.schedule('0 23 * * *', async () => { 
      console.log('Auto checkout running'); 
  });
};

export default setupCronJobs;