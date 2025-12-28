import dashboardService from "../services/dashboard.service.js";

/**
 * @desc    Get Admin Dashboard Stats (KPIs, Charts, Top Projects)
 * @route   GET /dashboard/admin-stats?projectId=...
 */
export const getAdminStats = async (req, res) => {
  try {
    const currentOrgId = req.user.currentOrganizationId;
    const { projectId } = req.query; // Nhận projectId từ query

    const stats = await dashboardService.getAdminStats(currentOrgId, projectId);

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
 * @route   GET /dashboard/member-stats?projectId=...
 */
export const getMemberStats = async (req, res) => {
    try {
      const userId = req.user._id;
      const { projectId } = req.query; // Nhận projectId từ query

      const stats = await dashboardService.getMemberStats(userId, projectId);
  
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
 * @route   GET /dashboard/manager-stats?projectId=...
 */
export const getManagerStats = async (req, res) => {
    try {
      const userId = req.user._id;
      const currentOrgId = req.user.currentOrganizationId;
      const { projectId } = req.query; // Nhận projectId từ query
  
      const stats = await dashboardService.getManagerStats(userId, currentOrgId, projectId);
  
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