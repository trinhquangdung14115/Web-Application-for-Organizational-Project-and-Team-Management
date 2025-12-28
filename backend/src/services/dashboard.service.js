import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import Task from "../models/task.model.js";

class DashboardService {

  getDayName(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  }

  // Helper: Tạo filter cho Task
  _getTaskFilter(baseFilter, projectId) {
    const filter = { ...baseFilter, deletedAt: null };
    if (projectId && projectId !== 'all') {
      filter.projectId = new mongoose.Types.ObjectId(projectId);
    }
    return filter;
  }

  async getAdminStats(currentOrganizationId, projectId = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");
    const orgIdObj = new mongoose.Types.ObjectId(currentOrganizationId);
    
    // Base filter cho Project
    const projectQuery = { organizationId: currentOrganizationId, deletedAt: null };
    // Base filter cho Member
    const memberQuery = { organizationId: currentOrganizationId, status: "ACTIVE" };

    // Nếu có projectId, scope lại query
    if (projectId && projectId !== 'all') {
        projectQuery._id = new mongoose.Types.ObjectId(projectId);
        memberQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    // Task Filter (Logic quan trọng: Filter theo Project ID nếu có)
    const taskMatchStage = { 
        "project.organizationId": orgIdObj, 
        "project.deletedAt": null, 
        deletedAt: null 
    };
    if (projectId && projectId !== 'all') {
        taskMatchStage["project._id"] = new mongoose.Types.ObjectId(projectId);
    }

    const [
      totalProjects, 
      activeProjects,
      archivedProjects,
      completedProjects,
      totalMembers,
      allTasksCount,
      doneTasksCount,
      tasksByPriority
    ] = await Promise.all([
      Project.countDocuments(projectQuery),
      Project.countDocuments({ ...projectQuery, status: "active" }),
      Project.countDocuments({ ...projectQuery, status: "archived" }),
      Project.countDocuments({ ...projectQuery, status: "completed" }),
      
      // Đếm member (distinct user)
      ProjectMember.distinct("userId", memberQuery).then(res => res.length),

      // Task Aggregation
      Task.aggregate([
        {
          $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" }
        },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        {
          $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" }
        },
        { $unwind: "$project" },
        { $match: { ...taskMatchStage, status: "DONE" } },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        {
          $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" }
        },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);

    const avgProgress = allTasksCount > 0 
      ? Math.round((doneTasksCount / allTasksCount) * 100) 
      : 0;

    const projectStatusDistribution = [
      { name: "Active", value: activeProjects },
      { name: "Archived", value: archivedProjects },
      { name: "Completed", value: completedProjects }
    ];

    // Upcoming Deadlines (Cũng phải filter theo project)
    const upcomingDeadlineProjects = await Project.find({
      ...projectQuery, // Apply filter project ID
      status: "active",
      deadline: { $gte: new Date() } 
    })
    .select("name deadline status")
    .sort({ deadline: 1 })
    .limit(5);

    // Xử lý Priority Map
    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    tasksByPriority.forEach(item => {
      const key = item._id ? item._id.toUpperCase() : "MEDIUM";
      if (priorityMap.hasOwnProperty(key)) priorityMap[key] = item.count;
    });

    const priorityChartData = Object.keys(priorityMap).map(key => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(), 
      value: priorityMap[key]
    }));

    return {
      success: true,
      kpi: {
        totalProjects,
        totalMembers,
        completedProjects, 
        avgProgress
      },
      charts: {
        projectStatus: projectStatusDistribution,
        priorityDistribution: priorityChartData,
        progress: {
            total: allTasksCount,
            done: doneTasksCount,
            percent: avgProgress
        }
      },
      lists: {
        upcomingDeadlines: upcomingDeadlineProjects
      }
    };
  }

  async getMemberStats(userId, projectId = null) {
    if (!userId) throw new Error("USER_ID_REQUIRED");
    const now = new Date();

    // --- FIX LOGIC LỆCH SỐ LIỆU ---
    // Nếu có projectId: Chuyển sang chế độ "Team View" (Filter theo Project, bỏ Assignee)
    // Nếu không: Giữ chế độ "Personal View" (Filter theo Assignee)
    const baseMatch = { deletedAt: null };
    
    if (projectId && projectId !== 'all') {
        // Mode: Project Dashboard (Team View)
        baseMatch.projectId = new mongoose.Types.ObjectId(projectId);
    } else {
        // Mode: Personal Dashboard
        baseMatch.assigneeId = new mongoose.Types.ObjectId(userId);
    }

    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, priorityStatsRaw] = await Promise.all([
      Task.countDocuments(baseMatch),
      Task.countDocuments({ ...baseMatch, status: "TODO" }),
      Task.countDocuments({ ...baseMatch, status: "DOING" }),
      Task.countDocuments({ ...baseMatch, status: "DONE" }),
      Task.countDocuments({ ...baseMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      
      Task.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);
    
    // Priority Mapping
    const priority = { high: 0, medium: 0, low: 0 };
    if (priorityStatsRaw && Array.isArray(priorityStatsRaw)) {
        priorityStatsRaw.forEach(item => {
            if (item._id) {
                const key = item._id.toLowerCase();
                if (priority[key] !== undefined) {
                    priority[key] = item.count;
                } else {
                    priority['medium'] += item.count;
                }
            } else {
                priority['medium'] += item.count;
            }
        });
    }

    // Activity Chart (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const stats = await Task.aggregate([
      {
        $match: {
          ...baseMatch,
          status: "DONE", 
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const activityChart = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0]; 
      const found = stats.find(s => s._id === dateString);
      activityChart.push({
        day: this.getDayName(d),
        date: dateString,
        value: found ? found.count : 0
      });
    }

    return {
      kpi: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks },
      charts: { last7DaysActivity: activityChart },
      priority
    };
  }

  async getManagerStats(userId, currentOrganizationId, projectId = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");

    // 1. Lấy danh sách project quản lý
    const managedMemberships = await ProjectMember.find({
      userId: userId,
      organizationId: currentOrganizationId,
      status: "ACTIVE",
      roleInProject: { $in: ["Manager", "Admin"] } 
    }).select("projectId");

    if (!managedMemberships || managedMemberships.length === 0) {
      return {
        kpi: { myProjects: 0, teamSize: 0, tasksCompleted: 0 },
        charts: { priorityDistribution: [], progress: { total: 0, done: 0, percent: 0 } }
      };
    }

    let projectIds = managedMemberships.map(m => m.projectId);
    const totalManagedProjectsCount = projectIds.length; // Lưu tổng số project

    // 2. Filter theo Project được chọn
    if (projectId && projectId !== 'all') {
        const selectedIdStr = projectId.toString();
        if (projectIds.some(id => id.toString() === selectedIdStr)) {
            projectIds = [new mongoose.Types.ObjectId(projectId)];
        } else {
             return {
                kpi: { myProjects: 0, teamSize: 0, tasksCompleted: 0 },
                charts: { priorityDistribution: [], progress: { total: 0, done: 0, percent: 0 } }
            };
        }
    }

    // [FIX] Khai báo các biến còn thiếu
    const now = new Date();
    const baseMatch = { 
        projectId: { $in: projectIds }, 
        deletedAt: null 
    };

    // 3. Thực hiện query song song
    // Tách phần lấy Team Size ra riêng để tránh nhầm lẫn
    const teamSize = await ProjectMember.distinct("userId", { projectId: { $in: projectIds }, status: "ACTIVE" }).then(res => res.length);

    // Lấy chi tiết Task & Priority (Dùng baseMatch đã khai báo)
    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, priorityStatsRaw] = await Promise.all([
      Task.countDocuments(baseMatch),
      Task.countDocuments({ ...baseMatch, status: "TODO" }),
      Task.countDocuments({ ...baseMatch, status: "DOING" }),
      Task.countDocuments({ ...baseMatch, status: "DONE" }),
      Task.countDocuments({ ...baseMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      
      Task.aggregate([
        { $match: baseMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ])
    ]);

    // 4. Xử lý Priority Map
    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    if (priorityStatsRaw && Array.isArray(priorityStatsRaw)) {
        priorityStatsRaw.forEach(item => {
            const key = item._id ? item._id.toUpperCase() : "MEDIUM";
            if (priorityMap.hasOwnProperty(key)) {
                priorityMap[key] = item.count;
            } else {
                priorityMap['MEDIUM'] += item.count; // Fallback
            }
        });
    }

    const priorityChartData = Object.keys(priorityMap).map(key => ({
      name: key.charAt(0) + key.slice(1).toLowerCase(), 
      value: priorityMap[key]
    }));

    return {
      kpi: {
        myProjects: totalManagedProjectsCount,
        teamSize: teamSize,
        tasksCompleted: doneTasks, // Dùng doneTasks vừa query được
        // Trả về thêm các field này để Frontend hiển thị TaskSummary
        totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks
      },
      charts: {
        priorityDistribution: priorityChartData,
        progress: {
          total: totalTasks,
          done: doneTasks,
          percent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
        }
      }
    };
}
}

export default new DashboardService();