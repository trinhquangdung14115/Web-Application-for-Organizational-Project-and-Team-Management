import axiosInstance from './api';

// Helper để build query string gọn gàng
const buildQuery = (projectId, month, year) => {
  const params = new URLSearchParams();
  if (projectId && projectId !== 'all') params.append('projectId', projectId);
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  return params.toString() ? `?${params.toString()}` : '';
};

const getAdminStats = async (projectId = null, month = null, year = null) => {
  const query = buildQuery(projectId, month, year);
  const response = await axiosInstance.get(`/dashboard/admin-stats${query}`);
  return response.data.data;
};

const getMemberStats = async (projectId = null, month = null, year = null) => {
  const query = buildQuery(projectId, month, year);
  const response = await axiosInstance.get(`/dashboard/member-stats${query}`);
  return response.data.data;
};

const getManagerStats = async (projectId = null, month = null, year = null) => {
  const query = buildQuery(projectId, month, year);
  const response = await axiosInstance.get(`/dashboard/manager-stats${query}`);
  return response.data.data;
};

const dashboardService = {
  getAdminStats,
  getMemberStats,
  getManagerStats,
};

export default dashboardService;