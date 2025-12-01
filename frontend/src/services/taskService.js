import axiosInstance from "./api";

/**
 * Lấy danh sách công việc trong dự án
 */
export const getTasksByProject = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/projects/${projectId}/tasks`);
    return response.data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách công việc:", error);
    throw error.response?.data || { error: { message: "Failed to load tasks" } };
  }
};

/**
 * Tạo công việc mới
 */
export const createTask = async (projectId, taskData) => {
  try {
    const response = await axiosInstance.post(`/projects/${projectId}/tasks`, taskData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi tạo công việc:", error);
    throw error.response?.data || { error: { message: "Failed to create task" } };
  }
};

/**
 * Cập nhật công việc
 */
export const updateTask = async (taskId, updateData) => {
  try {
    const response = await axiosInstance.put(`/tasks/${taskId}`, updateData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật công việc:", error);
    throw error.response?.data || { error: { message: "Failed to update task" } };
  }
};

/**
 * Xóa công việc
 */
export const deleteTask = async (taskId) => {
  try {
    await axiosInstance.delete(`/tasks/${taskId}`);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa công việc:", error);
    throw error.response?.data || { error: { message: "Failed to delete task" } };
  }
};

/**
 * Thay đổi trạng thái công việc (kanban)
 */
export const updateTaskStatus = async (taskId, newStatus) => {
  try {
    const response = await axiosInstance.patch(`/tasks/${taskId}`, { status: newStatus });
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái công việc:", error);
    throw error.response?.data || { error: { message: "Failed to update task status" } };
  }
};

export const reorderTask = async (taskId, newStatus, newPosition) => {
  // Gọi PATCH /tasks/reorder
  // Endpoint này BE phải implement logic nhận position kiểu Float
  return axiosInstance.patch(`/tasks/reorder`, { taskId, newStatus, newPosition });
}; 

export default {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  reorderTask,
};
