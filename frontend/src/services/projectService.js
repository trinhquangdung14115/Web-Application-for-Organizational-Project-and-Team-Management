import axiosInstance from "./api";

/**
 * Lấy danh sách dự án
 */
export const getProjects = async () => {
  try {
    const response = await axiosInstance.get("/projects");
    return response.data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách dự án:", error);
    throw error.response?.data || { error: { message: "Failed to load projects" } };
  }
};

/**
 * Tạo dự án mới
 */
export const createProject = async (projectData) => {
  try {
    const response = await axiosInstance.post("/projects", projectData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi tạo dự án:", error);
    throw error.response?.data || { error: { message: "Failed to create project" } };
  }
};

/**
 * Lấy thông tin chi tiết dự án
 */
export const getProject = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/projects/${projectId}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin dự án:", error);
    throw error.response?.data || { error: { message: "Failed to load project details" } };
  }
};

/**
 * Cập nhật thông tin dự án
 */
export const updateProject = async (projectId, updateData) => {
  try {
    const response = await axiosInstance.put(`/projects/${projectId}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật dự án:", error);
    throw error.response?.data || { error: { message: "Failed to update project" } };
  }
};

/**
 * Xóa dự án
 */
export const deleteProject = async (projectId) => {
  try {
    await axiosInstance.delete(`/projects/${projectId}`);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa dự án:", error);
    throw error.response?.data || { error: { message: "Failed to delete project" } };
  }
};

/**
 * Lấy danh sách thành viên trong dự án
 */
export const getProjectMembers = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/projects/${projectId}/members`);
    return response.data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách thành viên:", error);
    throw error.response?.data || { error: { message: "Failed to load project members" } };
  }
};
export const getProjectLabels = async (projectId) => {
  // Logic gọi API lấy labels, ví dụ:
  // const response = await axios.get(`/projects/${projectId}/labels`);
  // return response.data;
  return []; // Mock tạm nếu chưa có API
};
export default {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getProjectMembers,
  getProjectLabels,
};
