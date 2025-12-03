
import React, { useEffect, useState } from 'react';
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { 
  ClipboardDocumentListIcon as TotalSolid, 
  ClockIcon as ClockSolid,
  ArrowPathIcon as ProgressSolid, 
  CheckCircleIcon as DoneSolid,
  ExclamationTriangleIcon as WarningSolid, 
} from '@heroicons/react/24/solid';

import { useNavigate, useLocation } from 'react-router-dom';

// Kanban drag & drop
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import TaskSummary from '../components/TaskSummary';
import { getProjects } from '../services/projectService';
import { getTasksByProject, updateTaskStatus, createTask } from '../services/taskService';
import { useAuth } from '../services/AuthContext';

// ===== Badge priority  =====
const PriorityBadge = ({ level }) => {
  const map = {
    High:   { bg: 'bg-red-100', text: 'text-red-600' },
    Medium: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Low:    { bg: 'bg-green-100', text: 'text-green-700' },
  };
  const c = map[level] ?? map.Medium;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${c.bg} ${c.text}`}>
      {level}
    </span>
  );
};

// ===== Kanban Card: click => TaskDetail page =====
const KanbanCard = ({ task, onOpenDetail }) => {
  return (
    <div
      type="button"
      onClick={() => onOpenDetail(task)}
      className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition"
    >
      {/* dòng badge */}
      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge level={task.priority} />
        {task.dueSoon && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">
            1 day left
          </span>
        )}
      </div>

      {/* title */}
      <h4 className="font-semibold text-gray-800 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* meta */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{task.due}</span>
          </div>
          <span
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${
              task.projectColor ?? 'bg-blue-50 text-blue-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
            {task.project}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold">
          {task.assignee?.[0] ?? '??'}
        </div>
      </div>
    </div>
  );
};

// ===== MyTasks =====
const MyTasks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ===== USER + ROLE (tuần 3) =====
  const currentUser = {
    id: user?._id,
    role: user?.role || 'Member',            // ADMIN | MANAGER | MEMBER
    name: user?.name || user?.fullname || 'User',
  };

  const roleUpper = (currentUser.role || '').toUpperCase();
  const isManagerOrAdmin = ['ADMIN', 'MANAGER', 'SUPER ADMIN'].includes(roleUpper);
  const canManageTasks = isManagerOrAdmin;

  const canDragTask = (task) => {
    //Manager/Admin có thể kéo thả tất cả
    if (isManagerOrAdmin) return true;
// Member chỉ được kéo thả task được giao
    if (!task.assigneeId || !currentUser.id ) return false;
    return task.assigneeId === currentUser.id;
  };

  // ===== FILTER UI =====
  const filterOptions = [
    { label: 'All statuses', active: true },
    { label: 'Me', active: false },
    { label: 'All projects', active: false },
    { label: 'All', active: false },
  ];

  const columns = [
    { id: 'Backlog',      label: 'Backlog' },
    { id: 'Todo',         label: 'Todo' },
    { id: 'In Progress',  label: 'In Progress' },
    { id: 'Done',         label: 'Done' },
  ];

  // ===== STATE =====
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [error, setError] = useState(null);

  const [currentProjectId, setCurrentProjectId] = useState(null);

  // modal tạo task
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    title: '',
    description: '',
    assigneeId: '',
    assigneeName: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    labels: '',
  });

  // Map status backend <-> UI columns 
  const STATUS_COLUMN_MAP = {
    TODO: 'Todo',
    DOING: 'In Progress',
    DONE: 'Done',
    BACKLOG: 'Backlog',
  };

  const STATUS_API_MAP = {
    Backlog: 'BACKLOG',
    Todo: 'TODO',
    'In Progress': 'DOING',
    Done: 'DONE',
  };

  // ===== Lấy danh sách Project để tìm ID dự án  =====
  useEffect(() => {
    const fetchFirstProject = async () => {
      const HARDCODE_PROJECT_ID = "6922ab8321ec753e4c8b7f27"; // id project bạn muốn dùng
  
      try {
        const projects = await getProjects();
  
        if (projects && projects.length > 0) {
          // log ra cho chắc
          console.log(
            "Projects from API:",
            projects.map((p) => ({ id: p._id, name: p.name }))
          );
  
          // ƯU TIÊN: tìm đúng project có id = HARDCODE
          const matched = projects.find((p) => p._id === HARDCODE_PROJECT_ID);
  
          const idToUse = matched
            ? matched._id              // nếu tìm được -> dùng hard-code chính xác
            : projects[0]._id;        // không thì fallback: project đầu tiên
  
          console.log("Using projectId =", idToUse);
          setCurrentProjectId(idToUse);
          setIsEmpty(false);
        } else {
          // Không có project nào từ API -> dùng hard-code
          console.warn(
            "No project from API -> fallback to HARDCODE_PROJECT_ID:",
            HARDCODE_PROJECT_ID
          );
          setCurrentProjectId(HARDCODE_PROJECT_ID);
          setIsEmpty(true);
        }
      } catch (err) {
        console.error(
          "Failed to load projects -> fallback to HARDCODE_PROJECT_ID",
          err
        );
        setError("Could not load projects. Please try again.");
  
        // API lỗi -> fallback luôn
        const HARDCODE_PROJECT_ID = "6922ab8321ec753e4c8b7f27";
        setCurrentProjectId(HARDCODE_PROJECT_ID);
  
        setIsEmpty(true);
      } finally {
        // GIỮ 2 dòng bạn muốn
        setIsLoading(false);
      }
    };
  
    fetchFirstProject();
  }, []);
  
  

  // ===== Có currentProjectId -> fetch tasks thật (mở rộng thêm field cho TaskDetail) =====
  useEffect(() => {
    if (!currentProjectId) return;

    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiTasks = await getTasksByProject(currentProjectId);

        const normalized = (apiTasks || []).map((t) => ({
          id: t.id || t._id,
          title: t.title || t.name || 'Untitled task',
          description: t.description || '',
          status: STATUS_COLUMN_MAP[t.status] || 'Todo',
          priority:
            (t.priority || 'Medium')[0].toUpperCase() +
            (t.priority || 'Medium').slice(1).toLowerCase(),
          due: t.dueDate || t.due || '—',
          project: t.projectName || 'Project',
          projectColor: t.projectColor,        // nếu backend có
          assignee: t.assigneeName || t.assigneeInitials || '??',
          assigneeId: t.assigneeId ? t.assigneeId.toString() : null,
          dueSoon: t.dueSoon || false,
          labels: t.labels || [],
          subtasks: t.subtasks || [],
          attachments: t.attachments || [],
          comments: t.comments || [],
          //api chưa có order index thì default 0
          position: t.orderIndex || t.position || 0,
        }));

        setTasks(normalized);
        setIsEmpty(normalized.length === 0);
      } catch (err) {
        console.error('Failed to load tasks', err);
        const status = err?.status || err?.response?.status;
        if (status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        setError(err?.response?.data?.message || err?.error?.message || 'Failed to load tasks');
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [currentProjectId, navigate]);

  // ===== Drag & Drop + PATCH status ( thêm quyền) =====
  const handleDragEnd = async ({ source, destination, draggableId }) => {
  // 1. Check cơ bản
  if (!destination) return;
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) return;
  // 1. Check cơ bản
  if (!destination) return;
  if (
    source.droppableId === destination.droppableId &&
    source.index === destination.index
  ) return;

  const destColumnId = destination.droppableId;
  const apiStatus = STATUS_API_MAP[destColumnId] || 'TODO';

  // 2. Lấy danh sách task trong cột ĐÍCH (Destination Column)
  // Phải sort đúng thứ tự hiện tại để tính toán vị trí kề
  const destTasks = tasks
    .filter(t => t.status === destColumnId) // Lấy cột đích
    .filter(t => t.id !== draggableId)      // Loại bỏ chính nó (để giả lập danh sách tĩnh)
    .sort((a, b) => a.position - b.position);

  // 3. Tính toán Position mới (Fractional Indexing)
  let newPosition;
  const destIndex = destination.index;
  
  // Task đứng TRƯỚC và SAU vị trí thả
  const prevTask = destTasks[destIndex - 1]; 
  const nextTask = destTasks[destIndex];

  // HẰNG SỐ KHOẢNG CÁCH (Dùng khi chèn vào đầu/cuối list rỗng)
  const BUFFER = 10000; 

  if (!prevTask && !nextTask) {
    // Trường hợp A: Cột rỗng
    newPosition = BUFFER; 
  } else if (!prevTask) {
    // Trường hợp B: Thả vào ĐẦU cột
    // Lấy vị trí thằng đầu tiên chia đôi (hoặc trừ buffer)
    newPosition = nextTask.position / 2;
  } else if (!nextTask) {
    // Trường hợp C: Thả vào CUỐI cột
    // Lấy thằng cuối cùng cộng thêm buffer
    newPosition = prevTask.position + BUFFER;
  } else {
    // Trường hợp D: Chèn vào GIỮA 2 task (QUAN TRỌNG)
    // Công thức trung bình cộng
    newPosition = (prevTask.position + nextTask.position) / 2;
  }

  // 4. Optimistic Update (Cập nhật UI ngay lập tức)
  const updatedTasks = tasks.map(t => {
    if (t.id === draggableId) {
      return { ...t, status: destColumnId, position: newPosition };
    }
    return t;
  });
  setTasks(updatedTasks);

  // 5. Gọi API Sync Backend
  try {
    // Gọi API Reorder thay vì updateTaskStatus cũ
    // API này cần Backend (Mduc) triển khai patch cả status và orderIndex
    await reorderTask(draggableId, apiStatus, newPosition);
  } catch (err) {
    console.error('Reorder failed', err);
    // Rollback logic (nếu cần thiết, fetch lại data cũ)
    setError("Failed to save new order");
  }
};

  // ===== end sort =====
  const sortTasks = (a, b) => {
    return a.position - b.position; // Sắp xếp tăng dần theo position (Task số nhỏ nằm trên)
  };

  // ===== SUMMARY từ tasks thật (giữ shape cũ cho TaskSummary) =====
  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.status === 'Todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'In Progress').length;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const dueSoonCount = tasks.filter((t) => t.dueSoon === true).length;

  const summaryData = [
    { number: totalCount,     label: 'Total',      icon: <TotalSolid />,    iconColor: 'text-gray-500',   bgColor: 'bg-gray-100',   textColor: 'text-gray-800' },
    { number: todoCount,      label: 'Todo',       icon: <ClockSolid />,    iconColor: 'text-gray-500',   bgColor: 'bg-gray-100',   textColor: 'text-gray-600' },
    { number: inProgressCount,label: 'In Progress',icon: <ProgressSolid />, iconColor: 'text-blue-500',   bgColor: 'bg-blue-100',   textColor: 'text-blue-600' },
    { number: doneCount,      label: 'Done',       icon: <DoneSolid />,     iconColor: 'text-green-500',  bgColor: 'bg-green-100',  textColor: 'text-green-600' },
    { number: dueSoonCount,   label: '1 day left', icon: <WarningSolid />,  iconColor: 'text-orange-500', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
  ];

  // ===== Create Task (ADMIN / MANAGER) =====
  const openCreateModal = (statusColumn = 'Todo') => {
    if (!canManageTasks) return;

    setNewTaskForm({
      title: '',
      description: '',
      assigneeId: currentUser.id,
      assigneeName: currentUser.name,
      priority: 'MEDIUM',
      status: STATUS_API_MAP[statusColumn] || 'TODO',
      dueDate: '',
      labels: '',
    });

    setIsCreateOpen(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: newTaskForm.title,
        description: newTaskForm.description,
        assigneeId: newTaskForm.assigneeId,
        priority: newTaskForm.priority, // HIGH / MEDIUM / LOW
        status: newTaskForm.status,     // BACKLOG / TODO / DOING / DONE
        dueDate: newTaskForm.dueDate,
        labels: newTaskForm.labels
          ? newTaskForm.labels.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };

      const created = await createTask(currentProjectId, payload);

      const uiTask = {
        id: created.id || created._id,
        title: created.title || 'Untitled task',
        description: created.description || '',
        status: STATUS_COLUMN_MAP[created.status] || 'Todo',
        priority:
          (created.priority || 'Medium')[0].toUpperCase() +
          (created.priority || 'Medium').slice(1).toLowerCase(),
        due: created.dueDate || '—',
        project: created.projectName || 'Project',
        assignee: created.assigneeName || currentUser.name,
        assigneeId: created.assigneeId || currentUser.id,
        dueSoon: false,
        labels: created.labels || [],
        subtasks: created.subtasks || [],
        attachments: created.attachments || [],
        comments: created.comments || [],
      };

      setTasks((prev) => [...prev, uiTask]);
      setIsEmpty(false);
      setIsCreateOpen(false);
    } catch (err) {
      console.error('Failed to create task', err);
      setError(err?.error?.message || 'Failed to create task');
    }
  };

  // ===== Open Task Detail page =====
  const openTaskDetail = (task) => {
    if (!task?.id) return;
  
    const role = (currentUser.role || "").toUpperCase();
    const isAdminRole =
      role === "ADMIN" || role === "SUPER ADMIN"; // tuỳ backend trả gì
  
    const basePath = isAdminRole ? "/admin/tasks" : "/tasks";
  
    navigate(`${basePath}/${task.id}`, {
      state: { task },  // gửi kèm data để TaskDetail dùng tạm trước khi fetch
    });
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">
      {/* Filters Section */}
      <div className="flex flex-wrap gap-3 mb-6 justify-between">
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((option, index) => (
            <button
              key={index}
              className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg border transition duration-150 shadow-sm
                ${
                  option.active
                    ? 'bg-white border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
            >
              <span>{option.label}</span>
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            </button>
          ))}
        </div>

        {canManageTasks && (
          <button
            type="button"
            onClick={() => openCreateModal('Todo')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Task
          </button>
        )}
      </div>

      <div className="border-t border-gray-200 mb-8" />

      {/* Task Summary Section */}
      <TaskSummary summaryData={summaryData} />

      {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

      {/* KANBAN */}
      {isLoading ? (
        <div className="mt-8 py-10 text-center text-gray-500 text-sm">
          Loading tasks...
        </div>
      ) : (
        <>
          {isEmpty && (
            <div className="mt-4 text-center text-gray-400 text-sm">
              No tasks yet for this project.
            </div>
          )}

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {columns.map((col) => {
                const list = tasks
                  .filter((t) => t.status === col.id)
                  .sort(sortTasks);

                return (
                  <div
                    key={col.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col"
                  >
                    {/* Header cột */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-700">{col.label}</h3>
                        <span className="text-xs text-gray-500">({list.length})</span>
                      </div>

                    
                    </div>

                    {/* List card */}
                    <Droppable droppableId={col.id}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex flex-col gap-3 min-h-[220px]"
                        >
                          {list.map((task, index) => {
                            const disabled = !canDragTask(task);
                            return (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                                isDragDisabled={disabled}
                              >
                                {(prov) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    {...(!disabled ? prov.dragHandleProps : {})}
                                  >
                                    <KanbanCard task={task} onOpenDetail={openTaskDetail} />
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </>
      )}

      {/* Modal Create Task */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTaskForm.title}
                  onChange={(e) =>
                    setNewTaskForm((f) => ({ ...f, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTaskForm.description}
                  onChange={(e) =>
                    setNewTaskForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee (mock)
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={newTaskForm.assigneeName}
                    onChange={(e) =>
                      setNewTaskForm((f) => ({ ...f, assigneeName: e.target.value }))
                    }
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm((f) => ({ ...f, priority: e.target.value }))
                    }
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={newTaskForm.status}
                    onChange={(e) =>
                      setNewTaskForm((f) => ({ ...f, status: e.target.value }))
                    }
                  >
                    <option value="BACKLOG">Backlog</option>
                    <option value="TODO">Todo</option>
                    <option value="DOING">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={newTaskForm.dueDate}
                    onChange={(e) =>
                      setNewTaskForm((f) => ({ ...f, dueDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Labels (comma separated)
                </label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={newTaskForm.labels}
                  onChange={(e) =>
                    setNewTaskForm((f) => ({ ...f, labels: e.target.value }))
                  }
                  placeholder="Design, Backend, API..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
