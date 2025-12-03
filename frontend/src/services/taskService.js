import axiosInstance from "./api";

/**
 * Lấy danh sách công việc (Sử dụng endpoint /tasks để hỗ trợ lọc)
 * @param {string} projectId 
 * @param {object} filters - { label: '', assignee: '' }
 */
export const getTasksByProject = async (projectId, filters = {}) => {
  try {
    // Backend controller `getFilteredTasks` hỗ trợ query: project, assignee, status
    const params = new URLSearchParams();
    
    // Luôn filter theo project hiện tại
    params.append('project', projectId);

    // Nếu có filter assignee (và không phải 'all')
    if (filters.assignee) {
        params.append('assignee', filters.assignee);
    }

    // Backend hiện chưa support filter theo 'label' trong model, 
    // nhưng nếu sau này có thì ta append vào đây.
    if (filters.label) {
        params.append('label', filters.label);
    }

    const queryString = params.toString();
    // Gọi vào GET /tasks thay vì /projects/:id/tasks
    const url = `/tasks${queryString ? `?${queryString}` : ''}`;

    const response = await axiosInstance.get(url);
    // Backend trả về { success: true, data: [...] }
    return response.data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách công việc:", error);
    throw error.response?.data || { error: { message: "Failed to load tasks" } };
  }
};

/**
 * Lấy danh sách thành viên của dự án
 */
export const getProjectMembers = async (projectId) => {
  try {
    const response = await axiosInstance.get(`/projects/${projectId}/members`);
    return response.data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy thành viên dự án:", error);
    return [];
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
 * Thay đổi trạng thái công việc
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

/**
 * Lấy chi tiết 1 task
 */
export const getTaskById = async (taskId) => {
  try {
    const response = await axiosInstance.get(`/tasks/${taskId}`);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết công việc:", error);
    throw error.response?.data || { error: { message: "Failed to load task detail" } };
  }
};

/**
 * Kéo thả task
 */
export const reorderTask = async (taskId, newStatus, newPosition) => {
  return axiosInstance.patch(`/tasks/reorder`, { taskId, newStatus, newPosition });
}; 

export default {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskById, 
  reorderTask,
  getProjectMembers
};