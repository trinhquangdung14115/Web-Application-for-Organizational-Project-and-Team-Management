import mongoose from "mongoose";
import Project from "../models/project.model.js";
import ProjectMember from "../models/projectMember.model.js";
import Task from "../models/task.model.js";
import Attendance from "../models/attendance.model.js"; 

class DashboardService {
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

  async _getDailyTaskStats(baseMatch, dateQuery) {
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

  async getAdminStats(currentOrganizationId, projectId = null, month = null, year = null) {
    if (!currentOrganizationId) throw new Error("ORGANIZATION_REQUIRED");
    
    const orgIdObj = new mongoose.Types.ObjectId(currentOrganizationId);
    
    const dateMeta = this._getMetaDate(month, year);
    const projectBaseFilter = { organizationId: currentOrganizationId, deletedAt: null };
    if (projectId && projectId !== 'all') {
      projectBaseFilter._id = new mongoose.Types.ObjectId(projectId);
    }

    const taskMatchStage = { 
      "project.organizationId": orgIdObj, 
      "project.deletedAt": null, 
      deletedAt: null,
      createdAt: dateMeta.query 
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
      tasksByPriority,
      upcomingDeadlines,
      attendanceStats,
      dailyTaskChart 
    ] = await Promise.all([
      Project.countDocuments(projectBaseFilter),
      Project.countDocuments({ ...projectBaseFilter, status: "active" }),
      Project.countDocuments({ ...projectBaseFilter, status: "archived" }),
      Project.countDocuments({ ...projectBaseFilter, status: "completed" }),
      ProjectMember.distinct("userId", { organizationId: currentOrganizationId, status: "ACTIVE" }).then(res => res.length),

      // Task Counts (Filtered by Time)
      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: { ...taskMatchStage, status: "DONE" } },
        { $count: "count" }
      ]).then(res => res[0]?.count || 0),

      Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),

      // Upcoming Deadlines
      Project.find({ ...projectBaseFilter, status: "active", deadline: { $gte: new Date() } })
        .select("name deadline status").sort({ deadline: 1 }).limit(5),
      
      this._getTodayAttendanceStats(currentOrganizationId, projectId && projectId !== 'all' ? [new mongoose.Types.ObjectId(projectId)] : null),

      this._getDailyTaskStats({
        "project.organizationId": orgIdObj,
        "project.deletedAt": null,
        deletedAt: null,
        ...(projectId && projectId !== 'all' ? { "project._id": new mongoose.Types.ObjectId(projectId) } : {})
      }, dateMeta, true) 
    ]);

    // Re-calculate daily stats specifically for Admin (Logic override from charts)
    const dailyChart = await Task.aggregate([
        { $lookup: { from: "projects", localField: "projectId", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $match: taskMatchStage },
        { $group: { _id: { $dayOfMonth: "$createdAt" }, count: { $sum: 1 } } }
    ]);
    
    // Map chart data
    const finalChart = [];
    for (let d = 1; d <= dateMeta.daysInMonth; d++) {
        const f = dailyChart.find(x => x._id === d);
        finalChart.push({ name: `${d}/${dateMeta.month}`, value: f ? f.count : 0 });
    }

    const avgProgress = allTasksCount > 0 ? Math.round((doneTasksCount / allTasksCount) * 100) : 0;

    const priorityMap = { "HIGH": 0, "MEDIUM": 0, "LOW": 0, "CRITICAL": 0 };
    tasksByPriority.forEach(item => {
      const key = item._id ? item._id.toUpperCase() : "MEDIUM";
      if (priorityMap.hasOwnProperty(key)) priorityMap[key] = item.count;
    });

    return {
      success: true,
      period: { month: dateMeta.month, year: dateMeta.year },
      kpi: { totalProjects, totalMembers, completedProjects, avgProgress },
      attendance: attendanceStats,
      charts: {
        taskActivity: finalChart, 
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

    if (projectId && projectId !== 'all') {
      projectIds = projectIds.filter(id => id.toString() === projectId.toString());
      if (!projectIds.length) return this._emptyStats();
    }

    const dateMeta = this._getMetaDate(month, year);
    
    const baseMatch = { 
        projectId: { $in: projectIds }, 
        deletedAt: null,
        createdAt: dateMeta.query 
    };

    const now = new Date();
    const [
        totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, 
        priorityStatsRaw, teamSize, attendanceStats,
        dailyChartRaw 
    ] = await Promise.all([
      Task.countDocuments(baseMatch),
      Task.countDocuments({ ...baseMatch, status: "TODO" }),
      Task.countDocuments({ ...baseMatch, status: "DOING" }),
      Task.countDocuments({ ...baseMatch, status: "DONE" }),
      Task.countDocuments({ ...baseMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      Task.aggregate([{ $match: baseMatch }, { $group: { _id: "$priority", count: { $sum: 1 } } }]),
      ProjectMember.distinct("userId", { projectId: { $in: projectIds }, status: "ACTIVE" }).then(res => res.length),
      this._getTodayAttendanceStats(currentOrganizationId, projectIds),
      this._getDailyTaskStats({ projectId: { $in: projectIds }, deletedAt: null }, dateMeta) 
    ]);

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
      charts: {
        taskActivity: dailyChartRaw, 
        progress: { total: totalTasks, done: doneTasks, percent: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0 }
      }
    };
  }

  async getMemberStats(userId, projectId = null, month = null, year = null) {
    const dateMeta = this._getMetaDate(month, year);
    
    const baseMatch = { 
        assigneeId: new mongoose.Types.ObjectId(userId),
        deletedAt: null,
        createdAt: dateMeta.query 
    };
    
    if (projectId && projectId !== 'all') {
      baseMatch.projectId = new mongoose.Types.ObjectId(projectId);
    } 

    const now = new Date();
    const [totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks, dailyChartRaw] = await Promise.all([
      Task.countDocuments(baseMatch),
      Task.countDocuments({ ...baseMatch, status: "TODO" }),
      Task.countDocuments({ ...baseMatch, status: "DOING" }),
      Task.countDocuments({ ...baseMatch, status: "DONE" }),
      Task.countDocuments({ ...baseMatch, dueDate: { $lt: now }, status: { $ne: "DONE" } }),
      this._getDailyTaskStats(baseMatch, dateMeta)
    ]);

    return { 
        success: true, 
        period: { month: dateMeta.month, year: dateMeta.year },
        kpi: { totalTasks, todoTasks, doingTasks, doneTasks, overdueTasks },
        charts: { taskActivity: dailyChartRaw }
    };
  }

  _emptyStats() {
    return { success: true, kpi: { totalTasks: 0, doneTasks: 0 }, attendance: { present: 0, late: 0, absent: 0, total: 0 }, charts: {} };
  }
}

export default new DashboardService();