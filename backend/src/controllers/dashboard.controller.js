import dashboardService from "../services/dashboard.service.js";

/**
 * @desc    Get Admin Dashboard Stats (KPIs, Charts, Top Projects)
 * @route   GET /dashboard/admin-stats?projectId=...&month=...&year=...
 */
export const getAdminStats = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    const currentUserId = req.user._id;
    const { projectId, month, year } = req.query;

    // Input Validation: Check month range as required by Lead
    if (month && (Number(month) < 1 || Number(month) > 12)) {
      return res.status(400).json({ 
        success: false, 
        message: "Month must be between 1 and 12" 
      });
    }

    // Pass month and year to service for time-based filtering
    const stats = await dashboardService.getAdminStats(
      currentUserId,
      currentOrgId, 
      projectId, 
      month ? Number(month) : null, 
      year ? Number(year) : null
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, message: "Organization context missing" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Get Member Dashboard Stats (Personal KPIs & Activity)
 * @route   GET /dashboard/member-stats?projectId=...&month=...&year=...
 */
export const getMemberStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { projectId, month, year } = req.query;

    if (month && (Number(month) < 1 || Number(month) > 12)) {
      return res.status(400).json({ success: false, message: "Month must be between 1 and 12" });
    }

    const stats = await dashboardService.getMemberStats(
      userId, 
      projectId, 
      month ? Number(month) : null, 
      year ? Number(year) : null
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};

/**
 * @desc    Get Manager Dashboard Stats (For Project Managers)
 * @route   GET /dashboard/manager-stats?projectId=...&month=...&year=...
 */
export const getManagerStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentOrgId = req.user.currentOrganizationId;
    const { projectId, month, year } = req.query;

    if (month && (Number(month) < 1 || Number(month) > 12)) {
      return res.status(400).json({ success: false, message: "Month must be between 1 and 12" });
    }

    const stats = await dashboardService.getManagerStats(
      userId, 
      currentOrgId, 
      projectId, 
      month ? Number(month) : null, 
      year ? Number(year) : null
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    if (err.message === 'ORGANIZATION_REQUIRED') {
      return res.status(400).json({ success: false, message: "Organization context missing" });
    }
    res.status(500).json({ success: false, error: "ServerError", message: err.message });
  }
};