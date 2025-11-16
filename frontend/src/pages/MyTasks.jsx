import React from 'react';
import { 
  ClipboardDocumentListIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  BellIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon, 
} from '@heroicons/react/24/outline'; 

// ===== Kanban drag & drop =====
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
// ===== end =====

import { useOutletContext } from 'react-router-dom';
import TaskSummary from '../components/TaskSummary';
  
// ======= Kanban Card (UI giống ảnh mẫu) =======
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

const KanbanCard = ({ task }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition">
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
      <h4 className="font-semibold text-gray-800 leading-snug">
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
          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md ${
            task.projectColor ?? 'bg-blue-50 text-blue-700'
          }`}>
            <span className="w-2 h-2 rounded-full bg-current opacity-60" />
            {task.project}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-semibold">
          {task.assignee}
        </div>
      </div>
    </div>
  );
};
// ======= end Kanban Card =======


// --- MyTasks Component ---
const MyTasks = () => {
  const { tasks, setTasks, dynamicTasksSummary } = useOutletContext();

  const filterOptions = [
    { label: 'All statuses', active: true },
    { label: 'Me', active: false },
    { label: 'All projects', active: false },
    { label: 'All', active: false },
  ];

  const columns = [
    { id: 'Backlog', label: 'Backlog' },
    { id: 'Todo', label: 'Todo' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Done', label: 'Done' },
  ];

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    setTasks(prev => {
      const item = prev.find(t => t.id === draggableId);
      if (!item) return prev;
      const updated = prev.map(t => (t.id === draggableId ? { ...t, status: destination.droppableId } : t));
      return updated;
    });
  };

  const addTask = (status) => {
    const newTask = {
      id: Date.now().toString(),
      title: 'New task',
      status,
      priority: 'Low',
      due: 'Dec 20',
      project: 'Website Redesign',
      assignee: 'SC',
    };
    setTasks(prev => [...prev, newTask]);
  };
  // ===== end Kanban =====

// ===== Sort tasks by priority (High -> Medium -> Low) =====
  const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

  const sortTasks = (a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;               // High trước Medium trước Low
    return (a.due || '').localeCompare(b.due || ''); // tie-break theo ngày (tuỳ chọn)
  };
  // ===== end sort =====

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">

      {/* Filters Section */}
      <div className="flex flex-wrap gap-3 mb-6">
        {filterOptions.map((option, index) => (
          <button 
            key={index}
            className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-lg border transition duration-150 shadow-sm
              ${option.active 
                ? 'bg-white border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100' 
              }`}
          >
            <span>{option.label}</span>
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>
        ))}
      </div>
      <div className="border-t border-gray-200 mb-8"></div>

      {/* Task Summary Section (Cards) */}
      <TaskSummary summaryData={dynamicTasksSummary} />

      {/* =================== KANBAN (giống ảnh mẫu) =================== */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {columns.map((col) => {
            const list = tasks
              .filter(t => t.status === col.id)
              .sort(sortTasks);
            return (
              <div key={col.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                {/* Header cột */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-700">{col.label}</h3>
                    <span className="text-xs text-gray-500">({list.length})</span>
                  </div>
                  <button
                    onClick={() => addTask(col.id)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add
                  </button>
                </div>

                {/* Danh sách thẻ kéo thả */}
                <Droppable droppableId={col.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex flex-col gap-3 min-h-[220px]"
                    >
                      {list.map((task, index) => (
                        <Draggable draggableId={task.id} index={index} key={task.id}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <KanbanCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
      {/* ================= end KANBAN ================= */}

    </div>
  );
}

export default MyTasks;
