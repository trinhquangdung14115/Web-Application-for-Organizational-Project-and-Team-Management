import React, { useEffect, useState, useMemo } from 'react';
import { ChevronDownIcon, PlusIcon, FunnelIcon, UserIcon, TagIcon, XMarkIcon, FolderIcon } from '@heroicons/react/24/outline';
import { 
  ClipboardDocumentListIcon as TotalSolid, 
  ClockIcon as ClockSolid, 
  ArrowPathIcon as ProgressSolid, 
  CheckCircleIcon as DoneSolid,
  ExclamationTriangleIcon as WarningSolid, 
} from '@heroicons/react/24/solid';

import { useNavigate, useLocation } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import TaskSummary from '../components/TaskSummary';
import { getProjects, getProjectLabels } from '../services/projectService';
import { getTasksByProject, updateTaskStatus, createTask, reorderTask, getProjectMembers } from '../services/taskService';
import { useAuth } from '../services/AuthContext';
import { useProject } from '../context/ProjectContext';

// ===== Helper: Format Date =====
const formatDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); 
};

// ===== Helper: Get Initials =====
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ===== Badge priority  =====
const PriorityBadge = ({ level }) => {
  const normalizedLevel = level ? level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() : 'Medium';
  const map = {
    High:     { bg: 'bg-red-100', text: 'text-red-600' },
    Critical: { bg: 'bg-red-200', text: 'text-red-800' },
    Medium:   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Low:      { bg: 'bg-green-100', text: 'text-green-700' },
  };
  const c = map[normalizedLevel] ?? map.Medium;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${c.bg} ${c.text}`}>
      {normalizedLevel}
    </span>
  );
};

// ===== Kanban Card =====
const KanbanCard = ({ task, onOpenDetail }) => {
  return (
    <div
      type="button"
      onClick={() => onOpenDetail(task)}
      className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition"
    >
      {/* --- PHẦN HEADER: Đưa Priority và Project Name lên đây --- */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* 1. Badge Priority */}
        <PriorityBadge level={task.priority} />

        {/* 2. Badge Project Name (Đưa từ dưới lên và bỏ giới hạn chiều rộng) */}
        {task.project && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                {task.project}
            </span>
        )}

        {/* 3. Badge Labels (Nếu có thật sự) */}
        {task.labels && task.labels.map((lbl, idx) => (
          <span key={idx} className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
            {lbl}
          </span>
        ))}

        {/* 4. Badge Due Soon */}
        {task.dueSoon && (
          <span className="text-xs px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">
            Due soon
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="font-semibold text-gray-800 leading-snug line-clamp-2 mb-3">
        {task.title}
      </h4>

      {/* --- PHẦN FOOTER: Chỉ còn Date và Avatar --- */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="flex items-center gap-1" title="Due Date">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{task.due}</span>
          </div>
          {/* Đã xóa phần Project ở đây để đưa lên trên */}
        </div>
        
        {/* Avatar Assignee */}
        <div 
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold overflow-hidden border border-gray-200" 
            title={task.assignee}
        >
          {task.assigneeAvatar ? (
             <img src={task.assigneeAvatar} alt={task.assignee} className="w-full h-full object-cover" />
          ) : (
             <span>{getInitials(task.assignee !== 'Unassigned' ? task.assignee : '?')}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ===== MyTasks =====
const MyTasks = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { 
        selectedProjectId, 
        switchProject, 
        project, 
        isLoadingProject,
        currentProjectRole  // Sử dụng helper từ context
    } = useProject();
    
    // ========== PERMISSION LOGIC =========
    // 1. Lấy System Role
    const systemRole = user?.role || 'Member';
    const isSystemAdmin = systemRole === 'Admin';
    
    // 2. Lấy Project Role từ context (đã được fetch từ API)
    const projectRole = currentProjectRole || 'Member';
    
    // 3. Tính toán effective role
    // - System Admin luôn có quyền cao nhất
    // - Nếu không phải System Admin, dùng project role
    const effectiveRole = isSystemAdmin ? 'Admin' : projectRole;
    
    // 4. Check quyền quản lý tasks
    const isManagerOrAdmin = ['Admin', 'Manager'].includes(effectiveRole);
    const canManageTasks = isManagerOrAdmin && selectedProjectId && selectedProjectId !== 'all';
    
    // Debug log
    useEffect(() => {
        console.log('🔐 [MyTasks] Permission check:', {
            systemRole,
            isSystemAdmin,
            projectRole,
            effectiveRole,
            isManagerOrAdmin,
            canManageTasks,
            selectedProjectId
        });
    }, [systemRole, projectRole, effectiveRole, selectedProjectId]);
    
    const currentUser = {
        id: user?._id || user?.id,
        name: user?.name || 'Unknown User',
        role: effectiveRole
    };
    
    const [projectsList, setProjectsList] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);
    const [error, setError] = useState(null);
  
    const [filters, setFilters] = useState({ label: '', assignee: '' });
    const [projectMembers, setProjectMembers] = useState([]);
    const [projectLabels, setProjectLabels] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState({
      title: '', description: '', assigneeId: '', assigneeName: '',
      priority: 'MEDIUM', status: 'TODO', dueDate: '', labels: '',
    });

    const columns = [
        { id: 'Backlog', label: 'Backlog' },
        { id: 'Todo', label: 'Todo' },
        { id: 'In Progress', label: 'In Progress' },
        { id: 'Done', label: 'Done' }
    ];

    const canDragTask = (task) => {
        if (isManagerOrAdmin) return true;
        return task.assigneeId === currentUser.id;
    };

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

    // 1. FETCH PROJECTS
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await getProjects();
                setProjectsList(data || []);
                
                if (data && data.length > 0 && (!selectedProjectId || selectedProjectId === 'all')) {
                    switchProject(data[0]._id, data[0].name);
                }
            } catch (err) {
                console.error("Failed to load projects", err);
            }
        };
        fetchProjects();
    }, []);

    // 2. Lấy Members, Labels & Fill Dropdown
    useEffect(() => {
        if (!selectedProjectId || selectedProjectId === 'all') {
            setTasks([]);
            setProjectMembers([]);
            return;
        }
        
        const fetchMeta = async () => {
            try {
                const [members, labels] = await Promise.all([
                    getProjectMembers(selectedProjectId),
                    getProjectLabels(selectedProjectId)
                ]);

                const formattedMembers = members.map(m => ({
                    id: m.user?._id || m.user || m._id, 
                    name: m.user?.name || m.name || 'Unnamed Member',
                    role: m.role || 'Member'
                }));
                setProjectMembers(formattedMembers);
                setProjectLabels(labels);
            } catch (err) {
                console.error("Failed to load project meta:", err);
            }
        };
        fetchMeta();
    }, [selectedProjectId]);

    // 3. FETCH TASKS
    useEffect(() => {
        if (!selectedProjectId || selectedProjectId === 'all') {
            setTasks([]);
            setIsEmpty(true);
            setIsLoading(false);
            return;
        }

        const fetchTasks = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const apiTasks = await getTasksByProject(selectedProjectId, filters);

                let filteredRawTasks = apiTasks || [];

                if (filters.label) {
                    filteredRawTasks = filteredRawTasks.filter((t) => 
                        t.labels && t.labels.includes(filters.label)
                    );
                }

                if (filters.assignee) {
                    filteredRawTasks = filteredRawTasks.filter((t) => {
                        const aId = t.assigneeId?._id || t.assigneeId || ''; 
                        return aId === filters.assignee;
                    });
                }

                const normalized = filteredRawTasks.map((t) => {
                    const assigneeObj = t.assigneeId; 
                    const assigneeName = assigneeObj ? assigneeObj.name : 'Unassigned';
                    const assigneeId = assigneeObj ? assigneeObj._id : null;
                    const projectName = t.projectId ? t.projectId.name : 'Unknown Project';
                    const isDueSoon = t.dueDate ? (new Date(t.dueDate) - new Date() < 86400000 && new Date(t.dueDate) > new Date()) : false;

                    return {
                        id: t._id,
                        title: t.title || 'Untitled task',
                        description: t.description || '',
                        status: STATUS_COLUMN_MAP[t.status] || 'Todo',
                        priority: t.priority || 'Medium',
                        due: formatDate(t.dueDate),
                        project: projectName,
                        assignee: assigneeName,
                        assigneeId: assigneeId,
                        dueSoon: isDueSoon,
                        labels: (t.labels || []).map(l => l.name || l),
                        position: t.orderIndex || 0,
                    };
                });

                setTasks(normalized);
                setIsEmpty(normalized.length === 0);
            } catch (err) {
                console.error('Failed to load tasks', err);
                setError('Failed to load tasks');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTasks();
    }, [selectedProjectId, filters]);

    // Drag & Drop
    const handleDragEnd = async ({ source, destination, draggableId }) => {
        // 1. Check cơ bản
        if (!destination) return;
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) return;

        const destColumnId = destination.droppableId;
        const apiStatus = STATUS_API_MAP[destColumnId] || 'TODO';

        const destTasks = tasks
            .filter(t => t.status === destColumnId)
            .filter(t => t.id !== draggableId)
            .sort((a, b) => a.position - b.position);

        let newPosition;
        const destIndex = destination.index;
        const prevTask = destTasks[destIndex - 1]; 
        const nextTask = destTasks[destIndex];
        const BUFFER = 10000; 

        if (!prevTask && !nextTask) newPosition = BUFFER; 
        else if (!prevTask) newPosition = nextTask.position / 2;
        else if (!nextTask) newPosition = prevTask.position + BUFFER;
        else newPosition = (prevTask.position + nextTask.position) / 2;

        const updatedTasks = tasks.map(t => {
            if (t.id === draggableId) {
                return { ...t, status: destColumnId, position: newPosition };
            }
            return t;
        });
        setTasks(updatedTasks);

        try {
            await reorderTask(draggableId, apiStatus, newPosition);
        } catch (err) {
            console.error('Reorder failed', err);
            setError("Failed to save new order");
        }
    };

    const sortTasks = (a, b) => a.position - b.position;

    // Summary Counts
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
        { number: dueSoonCount,   label: 'Due soon',   icon: <WarningSolid />,  iconColor: 'text-orange-500', bgColor: 'bg-orange-100', textColor: 'text-orange-600' },
    ];

    // Create Task
    const openCreateModal = (statusColumn = 'Todo') => {
        if (!canManageTasks) {
            console.warn('⚠️ No permission to create task. Role:', effectiveRole);
            return;
        }
        setNewTaskForm({
            title: '', 
            description: '', 
            assigneeId: currentUser.id, 
            assigneeName: currentUser.name,
            priority: 'MEDIUM', 
            status: 'TODO', 
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
                priority: newTaskForm.priority,
                status: newTaskForm.status,
                dueDate: newTaskForm.dueDate,
                labels: newTaskForm.labels ? newTaskForm.labels.split(',').map(s => s.trim()) : [],
            };

            const created = await createTask(selectedProjectId, payload);
            
            const uiTask = {
                id: created._id,
                title: created.title,
                description: created.description,
                status: STATUS_COLUMN_MAP[created.status],
                priority: created.priority,
                due: formatDate(created.dueDate),
                project: "Current Project", 
                assignee: projectMembers.find(m => m.id === created.assigneeId)?.name || 'Unassigned',
                assigneeId: created.assigneeId,
                dueSoon: false,
                labels: payload.labels || [],
                position: created.orderIndex, 
            };

            setTasks((prev) => [...prev, uiTask]);
            setIsEmpty(false);
            setIsCreateOpen(false);
        } catch (err) {
            console.error('Failed to create task', err);
            setError('Failed to create task');
        }
    };

    const openTaskDetail = (task) => {
        if (!task?.id) return;
        // Dùng effectiveRole để xác định route
        const isAdminRoute = effectiveRole === 'Admin' || systemRole === 'Admin';
        const basePath = isAdminRoute ? "/admin/tasks" : "/tasks";
        navigate(`${basePath}/${task.id}`, { state: { task } });
    };

    const clearFilters = () => setFilters({ label: '', assignee: '' });
    const hasActiveFilters = filters.label || filters.assignee;

    const derivedLabels = useMemo(() => {
        const allLabels = tasks.flatMap(t => t.labels || []);
        return [...new Set(allLabels)].sort();
    }, [tasks]);

    // Loading state khi đang fetch project details
    if (isLoadingProject) {
        return (
            <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">
                <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500">Loading project...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">
             {/* Debug chỉ log console thôi */}
        {/* {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <strong>Debug:</strong> System: {systemRole} | Project: {projectRole} | Effective: {effectiveRole} | Can Manage: {canManageTasks ? 'Yes' : 'No'}
            </div>
        )} */}
            
            <TaskSummary summaryData={summaryData} />
            <div className="mb-6"></div>

            {/* FILTER BAR & TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Label Filter */}
                    <div className="relative">
                        <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none shadow-sm cursor-pointer hover:bg-gray-50 min-w-[140px]"
                            value={filters.label}
                            onChange={(e) => setFilters(prev => ({...prev, label: e.target.value}))}
                        >
                            <option value="">All Labels</option>
                            {derivedLabels.length > 0 ? (
                                derivedLabels.map((lbl, index) => (
                                    <option key={index} value={lbl}>{lbl}</option>
                                ))
                            ) : (
                                <option disabled>No labels found</option>
                            )}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Assignee Filter */}
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            className="appearance-none pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none shadow-sm cursor-pointer hover:bg-gray-50 min-w-[160px]"
                            value={filters.assignee}
                            onChange={(e) => setFilters(prev => ({...prev, assignee: e.target.value}))}
                        >
                            <option value="">All Assignees</option>
                            {projectMembers.map((member) => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>

                    {hasActiveFilters && (
                        <button 
                            onClick={clearFilters}
                            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            <XMarkIcon className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>

                {/* New Task Button - chỉ hiện khi có quyền */}
                {canManageTasks && (
                    <button
                        type="button"
                        onClick={() => openCreateModal('Todo')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-brand)] text-white text-sm font-medium shadow-sm whitespace-nowrap"
                    >
                        <PlusIcon className="w-4 h-4" />
                        New Task
                    </button>
                )}
            </div>

            <div className="border-t border-gray-200 mb-8" />
            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}

            {/* KANBAN BOARD */}
            {isLoading ? (
                <div className="mt-8 py-10 text-center text-gray-500 text-sm">Loading tasks...</div>
            ) : (
                <>
                    {isEmpty ? (
                        <div className="mt-4 text-center text-gray-400 text-sm py-10 bg-white rounded-xl border border-dashed border-gray-200">
                            {!selectedProjectId || selectedProjectId === 'all'
                                ? "Please select a project to view tasks."
                                : projectsList.length === 0 
                                    ? "No projects found. Please create a project first." 
                                    : hasActiveFilters 
                                        ? "No tasks match your filters." 
                                        : "No tasks yet for this project."}
                        </div>
                    ) : (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {columns.map((col) => {
                                    const list = tasks.filter((t) => t.status === col.id).sort(sortTasks);
                                    return (
                                        <div key={col.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-gray-700">{col.label}</h3>
                                                    <span className="text-xs text-gray-500">({list.length})</span>
                                                </div>
                                            </div>
                                            <Droppable droppableId={col.id}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-3 min-h-[220px]">
                                                        {list.map((task, index) => {
                                                            const disabled = !canDragTask(task);
                                                            return (
                                                                <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={disabled}>
                                                                    {(prov) => (
                                                                        <div ref={prov.innerRef} {...prov.draggableProps} {...(!disabled ? prov.dragHandleProps : {})}>
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
                    )}
                </>
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                          <h2 className="text-lg font-semibold text-gray-900">Create New Task</h2>
                          <button type="button" onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full hover:bg-gray-100">✕</button>
                        </div>
                        <form onSubmit={handleCreateTask} className="px-6 py-5 space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newTaskForm.title} onChange={(e) => setNewTaskForm((f) => ({ ...f, title: e.target.value }))} required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newTaskForm.description} onChange={(e) => setNewTaskForm((f) => ({ ...f, description: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                              <select className="w-full border appearance-none border-gray-300 rounded-lg px-3 py-2 text-sm" value={newTaskForm.assigneeId} onChange={(e) => setNewTaskForm((f) => ({ ...f, assigneeId: e.target.value }))}>
                                <option value="">Unassigned</option>
                                {projectMembers
                                  .filter(m => m.role !== 'Admin')
                                  .map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select className="w-full border appearance-none border-gray-300 rounded-lg px-3 py-2 text-sm" value={newTaskForm.priority} onChange={(e) => setNewTaskForm((f) => ({ ...f, priority: e.target.value }))}>
                                <option value="HIGH">High</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="LOW">Low</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            {/* Hiển thị box xám, không cho click chọn */}
                            <div className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed">
                              Backlog
                            </div>
                          </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                              <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newTaskForm.dueDate} onChange={(e) => setNewTaskForm((f) => ({ ...f, dueDate: e.target.value }))} />
                            </div>
                          </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Labels</label>
                              <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                                placeholder="e.g. Design, Frontend, Bug (comma separated)"
                                value={newTaskForm.labels} 
                                onChange={(e) => setNewTaskForm((f) => ({ ...f, labels: e.target.value }))} 
                              />
                              <p className="text-xs text-gray-400 mt-1">Separate multiple labels with commas.</p>
                            </div>
                          <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                            <button type="submit" className="px-4 py-2 text-sm rounded-lg bg-[var(--color-brand)] text-white">Create Task</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
        </div>
    );
};

export default MyTasks;