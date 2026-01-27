import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import Task from "../models/task.model.js";
import Attendance from "../models/attendance.model.js"; 
import ActivityLog from "../models/activityLog.model.js";
import User from "../models/user.model.js";
class DashboardService {
  /**
   * Helper tạo Regex bền bỉ: 
   * - 'i': Không phân biệt hoa thường
   * - trim(): Bỏ qua khoảng trắng thừa
   */
  _statusRegex(status) {
    return new RegExp(`^\\s*${status}\\s*$`, 'i');
  } 
  _getDateRange(month, year) {
    if (!month || !year) return null;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { $gte: start, $lte: end };
  }

  _getMetaDate(month, year) {
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);
    return { 
      query: { $gte: start, $lte: end },
      daysInMonth: end.getDate(),
      month: m,
      year: y
    };
  }

  async _getRecentActivities(matchStage, limit = 10) {
    try {
      return await ActivityLog.find(matchStage)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email avatar") // Populate user info để hiện avatar
        .lean();
    } catch (error) {
      console.error("Error fetching activities:", error);
      return [];
    }
  }

  async _getDailyTaskStats(baseMatch, dateQuery, isForAdmin = false) {
    // Với Admin/Manager view, ta có thể muốn group data để đảm bảo đủ ngày
    const dailyData = await Task.aggregate([
      { 
        $match: { 
          ...baseMatch, 
          createdAt: dateQuery.query 
        } 
      },
      { 
        $group: { 
          _id: { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 } 
        } 
      }
    ]);

    const chartData = [];
    for (let day = 1; day <= dateQuery.daysInMonth; day++) {
      const found = dailyData.find(d => d._id === day);
      chartData.push({
        name: `${day}/${dateQuery.month}`, 
        value: found ? found.count : 0
      });
    }

    return chartData;
  }

  async _getTodayAttendanceStats(organizationId, projectIds = null) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const matchStage = {
      organizationId: new mongoose.Types.ObjectId(organizationId),
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    };

    if (projectIds && projectIds.length > 0) {
      matchStage.projectId = { $in: projectIds };
    }

    const stats = await Attendance.aggregate([
      { $match: matchStage },
      { 
        $group: { 
          _id: "$status", 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const result = { present: 0, late: 0, absent: 0, total: 0 };
    stats.forEach(item => {
      const key = item._id ? item._id.toLowerCase() : 'present';
      if (result[key] !== undefined) result[key] = item.count;
      result.total += item.count;
    });

    return result;
  }

  async getAdminStats(currentUserId,currentOrganizationId, projectId = null, month = null, year = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");
    
    const orgIdObj = new mongoose.Types.ObjectId(currentOrganizationId);
    
    const dateMeta = this._getMetaDate(month, year);
    const projectBaseFilter = { organizationId: orgIdObj, deletedAt: null };
    if (projectId && projectId !== 'all') {
      projectBaseFilter._id = new mongoose.Types.ObjectId(projectId);
    }

    const activityMatch = { organizationId: currentOrganizationId };

    // Tách filter cho Task: Không áp dụng filter ngày tạo cho tổng quan (Snapshot)
    // Chỉ áp dụng filter project/org
    const taskSnapshotMatch = { 
      "project.organizationId": orgIdObj, 
      "project.deletedAt": null, 
      deletedAt: null
    };

    if (projectId && projectId !== 'all') {
      taskSnapshotMatch["project._id"] = new mongoose.Types.ObjectId(projectId);
    }

    // Sử dụng đầu ngày hiện tại để so sánh chính xác hơn
    const startRange = new Date();
    startRange.setDate(startRange.getDate() - 30); 
    startRange.setHours(0, 0, 0, 0);


    const [
      totalProjects, 
      activeProjects,
      archivedProjects,
      completedProjects,
      totalMembers, 
      allTasksCount,
      doneTasksCount,
      tasksByPriority,
      attendanceStats,
      dailyTaskChart,
      recentActivities 
    ] = await Promise.all([
      Project.countDocuments(projectBaseFilter),
      Project.countDocuments({ ...projectBaseFilter, status: this._statusRegex("ACTIVE")  }),
      Project.countDocuments({ ...projectBaseFilter, status: this._statusRegex("ARCHIVED")  }),
      Project.countDocuments({ ...projectBaseFilter, status: this._statusRegex("COMPLETED")  }),
      ProjectMember.distinct("userId", { 
        organizationId: orgIdObj, 
        status: this._statusRegex("ACTIVE"),
        userId: { $ne: currentUserId } 
      }).then(res => res.length),

      // Task Counts (Snapshot - Không lọc theo ngày tạo để hiện đúng tổng số)
      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskSnapshotMatch },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: { ...taskSnapshotMatch, status: "DONE" } },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskSnapshotMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),

      
      
      this._getTodayAttendanceStats(currentOrganizationId, projectId && projectId !== 'all' ? [new mongoose.Types.ObjectId(projectId)] : null),

      // Daily stats: Vẫn giữ filter ngày tạo (để vẽ biểu đồ activity theo ngày)
      this._getDailyTaskStats({
        "project.organizationId": orgIdObj,
        "project.deletedAt": null,
        deletedAt: null,
        ...(projectId && projectId !== 'all' ? { "project._id": new mongoose.Types.ObjectId(projectId) } : {})
      }, dateMeta),
      
      this._getRecentActivities(activityMatch)
    ]);

    const avgProgress = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;

    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    tasksByPriority.forEach(item => {
      const key = item._id ? item._id.toUpperCase() : "MEDIUM";
      if (priorityMap.hasOwnProperty(key)) priorityMap[key] = item.count;
    });

     // Tạo một filter riêng cho Deadline, không bị phụ thuộc vào việc chọn 1 Project duy nhất
const deadlineFilter = {
    organizationId: orgIdObj,
        deletedAt: null,
        status: this._statusRegex("ACTIVE"),
        deadline: { $ne: null, $gte: startRange }
};


    const upcomingDeadlines = await Project.find(deadlineFilter)
      .select("name deadline status")
      .sort({ deadline: 1 })
      .limit(5)
      .lean(); // Dùng lean để lấy plain object cho nhanh

console.log("DEBUG DEADLINES:", upcomingDeadlines); // Log ra terminal của nodejs để xem có gì không

    return {
      success: true,
      period: { month: dateMeta.month, year: dateMeta.year },
      kpi: { totalProjects, totalMembers, completedProjects, avgProgress },
      attendance: attendanceStats,
      activities: recentActivities,
      charts: {
        taskActivity: dailyTaskChart, 
        projectStatus: [
          { name: "Active", value: activeProjects },
          { name: "Archived", value: archivedProjects },
          { name: "Completed", value: completedProjects }
        ],
        priorityDistribution: Object.keys(priorityMap).map(k => ({ name: k, value: priorityMap[k] })),
        progress: { total: allTasksCount, done: doneTasksCount, percent: avgProgress }
      },
      lists: { upcomingDeadlines }
    };
  }

  async getManagerStats(userId, currentOrganizationId, projectId = null, month = null, year = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");

    // 1. Get managed projects
    const managedProjects = await ProjectMember.find({
      userId: userId, organizationId: currentOrganizationId,
      status: "ACTIVE", roleInProject: { $in: ["Manager", "Admin"] } 
    }).select("projectId");

    if (!managedProjects.length) return this._emptyStats();

    let projectIds = managedProjects.map(m => m.projectId);
    const totalManagedProjects = projectIds.length;
    
    let activityMatch = { projectId: { $in: projectIds } };

    if (projectId && projectId !== 'all') {
      projectIds = projectIds.filter(id => id.toString() === projectId.toString());
      if (!projectIds.length) return this._emptyStats();
      activityMatch = { projectId: projectId };
    }

    const dateMeta = this._getMetaDate(month, year);
    
    // Không lọc theo ngày tạo để đếm đúng tổng số Task hiện có
    const snapshotMatch = { 
        projectId: { $in: projectIds }, 
        deletedAt: null
    };

    const now = new Date();
    const [
        totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, 
        priorityStatsRaw, teamSize, attendanceStats,
        dailyChartRaw,recentActivities 
    ] = await Promise.all([
      Task.countDocuments(snapshotMatch),
      Task.countDocuments({ ...snapshotMatch, status: "TODO" }),
      Task.countDocuments({ ...snapshotMatch, status: "DOING" }),
      Task.countDocuments({ ...snapshotMatch, status: "DONE" }),
      Task.countDocuments({ ...snapshotMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      Task.aggregate([{ $match: snapshotMatch }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      ProjectMember.distinct("userId", { 
          projectId: { $in: projectIds }, 
          status: "ACTIVE" 
      }).then(async (memberIds) => {
          return await User.countDocuments({
              _id: { $in: memberIds },
              role: { $ne: 'Admin' }
          });
      }),
      this._getTodayAttendanceStats(currentOrganizationId, projectIds),
      // Daily Stats: Sử dụng filter ngày để vẽ biểu đồ
      this._getDailyTaskStats({ projectId: { $in: projectIds }, deletedAt: null }, dateMeta),
      this._getRecentActivities(activityMatch) 
    ]);

    // Logic xử lý Priority Map cho Manager
    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    if (priorityStatsRaw && Array.isArray(priorityStatsRaw)) {
        priorityStatsRaw.forEach(item => {
            const key = item._id ? item._id.toUpperCase() : "MEDIUM";
            if (priorityMap.hasOwnProperty(key)) {
                priorityMap[key] = item.count;
            } else {
                priorityMap['MEDIUM'] += item.count;
            }
        });
    }
    const priorityChartData = Object.keys(priorityMap).map(k => ({ name: k, value: priorityMap[k] }));

    return {
      success: true,
      period: { month: dateMeta.month, year: dateMeta.year },
      kpi: {
        myProjects: totalManagedProjects,
        teamSize, 
        tasksCompleted: doneTasks, 
        taskSummary: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks }
      },
      attendance: attendanceStats,
      activities: recentActivities,
      charts: {
        taskActivity: dailyChartRaw, 
        //Trả về priorityDistribution để frontend vẽ biểu đồ
        priorityDistribution: priorityChartData,
        progress: { total: totalTasks, done: doneTasks, percent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 }
      }
    };
  }

  async getMemberStats(userId, projectId = null, month = null, year = null) {
    const dateMeta = this._getMetaDate(month, year);
    
    // Tách filter: Snapshot (Tổng quan) vs Activity (Theo thời gian)
    const snapshotMatch = { 
        assigneeId: new mongoose.Types.ObjectId(userId),
        deletedAt: null
    };

    let activityMatch = {};
    
    if (projectId && projectId !== 'all') {
      snapshotMatch.projectId = new mongoose.Types.ObjectId(projectId);
      activityMatch = { projectId: projectId };
    } else {
      // Nếu view All, Member chỉ nên thấy activity trong các project mình tham gia
      const myProjects = await ProjectMember.find({ userId, status: "ACTIVE" }).select("projectId");
      const myProjectIds = myProjects.map(p => p.projectId);
      activityMatch = { projectId: { $in: myProjectIds } };
    }

    const now = new Date();
    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, dailyChartRaw, priorityStatsRaw, recentActivities] = await Promise.all([
      Task.countDocuments(snapshotMatch),
      Task.countDocuments({ ...snapshotMatch, status: "TODO" }),
      Task.countDocuments({ ...snapshotMatch, status: "DOING" }),
      Task.countDocuments({ ...snapshotMatch, status: "DONE" }),
      Task.countDocuments({ ...snapshotMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      // Chart Activity vẫn dùng filter ngày
      this._getDailyTaskStats(snapshotMatch, dateMeta),
      Task.aggregate([
        { $match: snapshotMatch },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),
      this._getRecentActivities(activityMatch)
    ]);

    // Khởi tạo map mặc định
    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };

    // Cập nhật map từ kết quả query
    if (priorityStatsRaw && Array.isArray(priorityStatsRaw)) {
        priorityStatsRaw.forEach(item => {
            if (item._id) {
                const key = item._id.toUpperCase();
                if (priorityMap.hasOwnProperty(key)) {
                    priorityMap[key] = item.count;
                } else {
                    // Nếu có priority lạ, gộp vào MEDIUM (hoặc xử lý tùy ý)
                    priorityMap['MEDIUM'] += item.count;
                }
            } else {
                 // Nếu priority null/undefined
                 priorityMap['MEDIUM'] += item.count;
            }
        });
    }

    // 3. Chuyển đổi sang format biểu đồ
    const priorityChartData = Object.keys(priorityMap).map(k => ({ 
        name: k.charAt(0) + k.slice(1).toLowerCase(), // "High", "Medium"...
        value: priorityMap[k] 
        }));

    // Priority cho Member không được yêu cầu trong biểu đồ nhưng logic thống kê task vẫn giữ nguyên
    return { 
        success: true, 
        period: { month: dateMeta.month, year: dateMeta.year },
        kpi: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks },
        activities: recentActivities,
        charts: { taskActivity: dailyChartRaw, priorityDistribution: priorityChartData }
    };
  }

  _emptyStats() {
    return { success: true, kpi: { totalTasks: 0, doneTasks: 0 }, attendance: { present: 0, late: 0, absent: 0, total: 0 }, charts: { priorityDistribution: [], taskActivity: [] } };
  }
}

export default new DashboardService();