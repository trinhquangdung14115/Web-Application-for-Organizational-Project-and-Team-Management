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


//=====Comments======

/** * Lấy danh sách comment của 1 task
 * @param {string} taskId
 */
export const getTaskComments = async (taskId) => {
  try {
    // Gọi API lấy comment. Backend cần có route GET /tasks/:taskId/comments
    const response = await axiosInstance.get(`/tasks/${taskId}/comments`);
    return response.data.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách comment:", error);
    // Trả về mảng rỗng thay vì throw lỗi để không làm crash trang detail
    return [];
  }
};

/** * tạo comment mới cho 1 task
 * param {string} taskId
 * param {object} content - nội dung comment 
 */
 export const createComment = async (taskId, content) => {
  try {
    const response = await axiosInstance.post(`/tasks/${taskId}/comments`, {
      content,
    });
    // thường backend trả về comment mới
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi tạo comment:", error);
    throw error.response?.data || { error: { message: "Failed to create comment" } };
  }
};

// ======= Sub-tasks ========

/**
 * tạo subtask mới
 * @param {string} taskId 
 * @param {{ title: string }} subtaskData 
 */
export const createSubtask = async (taskId, subtaskData) => {
  try {
    const response = await axiosInstance.post(`/tasks/${taskId}/subtasks`, subtaskData);
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi tạo subtask:", error);
    throw error.response?.data || { error: { message: "Failed to create subtask" } };
  }
};

/**
 * toggle trạng thái hoàn thành của subtask
 * @param {string} taskId 
 * @param {string} subtaskId 
 */
export const toggleSubtask = async (taskId, subtaskId) => {
  try {
    const response = await axiosInstance.patch(
      `/tasks/${taskId}/subtasks/${subtaskId}/toggle`
    );
    return response.data.data;
  } catch (error) {
    console.error("Lỗi khi toggle subtask:", error);
    throw error.response?.data || { error: { message: "Failed to toggle subtask" } };
  }
};

/**
 * Xóa subtask
 * @param {string} taskId 
 * @param {string} subtaskId 
 */
export const deleteSubtask = async (taskId, subtaskId) => {
  try {
    await axiosInstance.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
    return true;
  } catch (error) {
    console.error("Lỗi khi xóa subtask:", error);
    throw error.response?.data || { error: { message: "Failed to delete subtask" } };
  }
};

/**
 * Gọi AI để gợi ý subtasks
 * @param {string} taskId 
 */
export const generateAiSubtasks = async (taskId) => {
  try {
    // Gọi đúng route đã định nghĩa trong task.routes.js
    const response = await axiosInstance.post(`/tasks/${taskId}/magic-subtasks`);
    return response.data.data; // Trả về mảng subtask mới
  } catch (error) {
    console.error("Lỗi AI Subtask:", error);
    throw error.response?.data || { error: { message: "Failed to generate subtasks" } };
  }
};

// ======= Attachments ========

/**
 * thêm attachment vào task
 * @param {string} taskId
 * @param {object} attachmentData - { name: string, url: string}
 */

export const addAttachment = async (taskId, attachmentData) => {
  try {
    const response = await axiosInstance.post(`/tasks/${taskId}/attachments`, attachmentData);
    return response.data.data;
  } catch (error) {
    console.error("Error adding attachment:", error);
    throw error.response?.data || { error: { message: "Failed to add attachment" } };
  }
};

/**
 * xóa attachment khỏi task
 * @param {string} taskId
 * @param {string} attachmentId
 */
export const removeAttachment = async (taskId, attachmentId) => {
  try {
    const response = await axiosInstance.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error removing attachment:", error);
    throw error.response?.data || { error: { message: "Failed to remove attachment" } };
  }
};

export default {
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskById, 
  reorderTask,
  getProjectMembers,
  //comment
  getTaskComments,
  createComment,
  //subtask
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  generateAiSubtasks,
  //attachments
  addAttachment,
  removeAttachment
};