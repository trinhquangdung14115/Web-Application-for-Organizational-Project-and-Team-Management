import axiosInstance from '../services/api';

const getAdminStats = async (projectId = null) => {
  let url = '/dashboard/admin-stats';
  if (projectId && projectId !== 'all') {
    url += `?projectId=${projectId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data.data;
};

const getMemberStats = async (projectId = null) => {
  let url = '/dashboard/member-stats';
  if (projectId && projectId !== 'all') {
    url += `?projectId=${projectId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data.data;
};

const getManagerStats = async (projectId = null) => {
  let url = '/dashboard/manager-stats';
  if (projectId && projectId !== 'all') {
    url += `?projectId=${projectId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data.data;
};

const dashboardService = {
  getAdminStats,
  getMemberStats,
  getManagerStats,
};

export default dashboardService;