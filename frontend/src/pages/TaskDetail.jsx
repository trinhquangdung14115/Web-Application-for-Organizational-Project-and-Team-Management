import React, { useEffect, useState, useCallback, useRef } from "react"; //them usseRef 
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
   getTaskById,
   getTaskComments,
   createComment,
   createSubtask,
   toggleSubtask,
   deleteSubtask,
   updateTask,
   getProjectMembers,
   generateAiSubtasks
} from "../services/taskService";
import { useAuth } from "../services/AuthContext"; // Import useAuth
import { ArrowLeftIcon, CalendarIcon, UserIcon, TagIcon, XMarkIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from "@heroicons/react/24/solid";

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Lấy thông tin user hiện tại

  //Ref cho ô imput Subtask
  const subtaskInputRef = useRef(null);

  // Lấy role của user để phân quyền
  const currentUserRole = (user?.role || "Member");
  const canManage = ["Manager", "Admin"].includes(currentUserRole);

  // Data có thể được truyền qua navigate state (từ màn hình danh sách)
  const taskFromState = location.state?.task || null;
  const [task, setTask] = useState(taskFromState);
  const [commentsList, setCommentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(!taskFromState);
  const [error, setError] = useState(null);

  //State cho comment vs subtask mới
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);

  //state cho AI subtask
  const [isGenerating, setIsGenerating] = useState(false);

  // state cho edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]); // Để hiện dropdown chọn người khi edit
  const [editForm, setEditForm] = useState({
    title: "", description: "", assigneeId: "", priority: "MEDIUM", status: "TODO", dueDate: ""
  });

  // tách fetchTask ra để reuse
  const fetchTask = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Gọi song song cả 2 API: Lấy Task info và Lấy Comments
      const [taskData, commentsData] = await Promise.all([
        getTaskById(taskId),
        getTaskComments(taskId).catch(() => []) // Nếu lỗi load comment thì trả về mảng rỗng, không chặn load task
      ]);

      setTask(prev => ({
        ...prev,
        ...taskData,
        assigneeName: taskData.assigneeId?.name || "Unassigned",
        projectName: taskData.projectId?.name || "Unknown Project",
        subtasks: taskData.subtasks || [],
        attachments: taskData.attachments || []
      }));

      // Set comments riêng
      setCommentsList(commentsData);
      // Nếu task có projectId, tranh thủ lấy members luôn để dùng cho form Edit
      if (taskData.projectId?._id || taskData.projectId) {
        const pId = taskData.projectId._id || taskData.projectId;
        getProjectMembers(pId).then(members => {
           const formatted = members.map(m => ({
               id: m.user?._id || m.user || m._id, 
               name: m.user?.name || m.name || 'Unnamed Member'
           }));
           setProjectMembers(formatted);
        }).catch(console.error);
     }

    } catch (err) {
      console.error("Load detail error:", err);
      setError("Failed to load task detail");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTask();
  }, [fetchTask]);

  // ====== HANDLERS: COMMENTS ======
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    try {
      setIsPostingComment(true);
      await createComment(taskId, newComment.trim());
      setNewComment("");
      //Sau khi post, gọi lại API lấy comment mới nhất
      const updatedComments = await getTaskComments(taskId);
      setCommentsList(updatedComments);

    } catch (err) {
      console.error("Post comment error:", err);
      setError("Failed to post comment");
    } finally {
      setIsPostingComment(false);
    }
  };  

  // ====== HANDLERS: SUBTASKS ======

  const handleFocusSubtaskInput = () => {
    // Cuộn xuống và focus vào ô input
    if (subtaskInputRef.current) {
        subtaskInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            subtaskInputRef.current.focus();
        }, 300); // Đợi cuộn xong thì focus
    }
  };

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    try {
      setIsCreatingSubtask(true);
      await createSubtask(taskId, { title: newSubtaskTitle.trim() });
      setNewSubtaskTitle("");

      //Reload task để lấy subtask mới
      const updatedTask = await getTaskById(taskId);
      setTask(prev => ({ ...prev, subtasks: updatedTask.subtasks }));
     
    } catch (err) {
      console.error("Create subtask error:", err);
      alert("Không tạo được sub-task: " + (err.message || "Lỗi server"));
      setError("Failed to create sub-task");
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtaskId) => {
    try {
      await toggleSubtask(taskId, subtaskId);
      //reload logic
      const updatedTask = await getTaskById(taskId);
      setTask(prev => ({ ...prev, subtasks: updatedTask.subtasks }));
    } catch (err) {
      console.error("Toggle subtask error:", err);
      setError("Failed to update sub-task");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("Delete this sub-task?")) return;
    try {
      await deleteSubtask(taskId, subtaskId);
      const updatedTask = await getTaskById(taskId);
      setTask(prev => ({ ...prev, subtasks: updatedTask.subtasks }));
    } catch (err) {
      console.error("Delete subtask error:", err);
      setError("Failed to delete sub-task");
    }
  };

  // --- AI HANDLER ---
  const handleMagicSubtasks = async () => {
    try {
        setIsGenerating(true); // Bật loading
        
        // Gọi API AI
        const newSubtasks = await generateAiSubtasks(taskId);
        
        // Cập nhật state ngay lập tức (thêm các subtask mới vào list cũ)
        setTask(prev => ({
            ...prev,
            subtasks: [...prev.subtasks, ...newSubtasks]
        }));
        
        alert(`AI has created ${newSubtasks.length} subtasks for you!`);
    } catch (err) {
        console.error(err);
        alert("AI Error: " + (err.message || "Cannot create subtasks"));
    } finally {
        setIsGenerating(false); // Tắt loading
    }
  };

  // --- HANDLERS: EDIT TASK ---
  const openEditModal = () => {
    if (!task) return;
    setEditForm({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId?._id || task.assigneeId || "",
        priority: task.priority || "MEDIUM",
        status: task.status || "TODO", // Lưu ý: map đúng value với backend (TODO/DOING/DONE)
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : "" // Format YYYY-MM-DD cho input date
    });
    setIsEditOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
        // --- FIX: Xử lý dữ liệu trước khi gửi ---
        const payload = {
          ...editForm,
          // Nếu là chuỗi rỗng thì gửi null, ngược lại gửi ID
          assigneeId: editForm.assigneeId ? editForm.assigneeId : null, 
          // Đảm bảo priority viết hoa đúng chuẩn backend nếu cần
          priority: editForm.priority.toUpperCase(),
        };
        // Gọi API update 
        const updated = await updateTask(taskId, payload);
        
        // Cập nhật lại UI ngay lập tức
        setTask(prev => ({
            ...prev,
            title: updated.title,
            description: updated.description,
            priority: updated.priority,
            status: updated.status,
            dueDate: updated.dueDate,
            assigneeId: updated.assigneeId, 
            assigneeName: projectMembers.find(m => m.id === updated.assigneeId || m.id === updated.assigneeId?._id)?.name || "Unassigned"
        }));
        
        setIsEditOpen(false);
        alert("Task updated successfully!"); // Báo thành công
    } catch (err) {
        console.error("Update task failed", err);
        // Hiển thị chi tiết lỗi từ backend nếu có
        alert("Failed to update task: " + (err.message || JSON.stringify(err)));
    }
  };

 // ========== RENDER GUARDS ==========
  if (isLoading && !task) return <div className="p-8 text-center">Loading...</div>;
  if (error && !task) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!task) return <div className="p-8 text-center">Not found</div>;
 

  const subtasks = task.subtasks || [];
  const attachments = task.attachments || []; 
  const comments = commentsList || [];
  // Xử lý hiển thị Priority (Backend trả về chữ hoa: HIGH, MEDIUM...)
  const displayPriority = task.priority 
    ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase() 
    : "Medium";

  return (
    <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to tasks
        </button>

        {canManage && (
          <div className="flex gap-2">
            <button 
              onClick={openEditModal}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
               Edit Task
            </button>
            <button
              onClick={handleFocusSubtaskInput}
              className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium  transition-colors">
              + Sub-task
            </button>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
             {/* Project Name Badge */}
            <div className="mb-2">
                 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {task.projectName || task.project || "Project"}
                 </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{task.title}</h1>
            <p className="text-xs text-gray-400 font-mono">ID: {task._id || task.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
                <span className="block text-xs text-gray-500 mb-1">Status</span>
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 uppercase tracking-wide">
                    {task.status}
                </span>
            </div>
            
            <div className="text-right border-l pl-3 ml-1">
                <span className="block text-xs text-gray-500 mb-1">Priority</span>
                <span
                className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold
                    ${
                    displayPriority === "High"
                        ? "bg-red-100 text-red-700"
                        : displayPriority === "Low"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                `}
                >
                {displayPriority}
                </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- THÊM ĐOẠN NÀY ĐỂ HIỆN LỖI --- */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                <XMarkIcon className="w-5 h-5" />
            </button>
        </div>
      )}

      {/* GRID 2 CỘT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Description, Subtasks, Comments */}
        <div className="lg:col-span-2 space-y-6">

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">Description</h2>
            <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
              {task.description || <span className="italic text-gray-400">No description provided.</span>}
            </div>
          </div>

          {/* Subtasks */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            {/* --- HEADER CÓ NÚT AI --- */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Sub-tasks</h2>
              {canManage && (
                 <button 
                   onClick={handleMagicSubtasks}
                   disabled={isGenerating}
                   className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                   title="Generate subtasks using AI"
                 >
                   {isGenerating ? (
                     <>
                        <svg className="animate-spin h-4 w-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Thinking...</span>
                     </>
                   ) : (
                     <>
                       <SparklesIcon className="w-4 h-4" />
                       <span>AI Suggest</span>
                     </>
                   )}
                 </button>
              )} 
            </div>

            {/* input tạo subtask mới */}
            {canManage && (
                  <div className="flex items-center gap-2 mb-4">
                  <input
                    ref={subtaskInputRef}
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="New sub-task title..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                  />
                  <button
                    onClick={handleCreateSubtask}
                    disabled={isCreatingSubtask || !newSubtaskTitle.trim()}
                    className="px-3 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-medium disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}    

            {subtasks.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No subtasks yet.</p>
            ) : (
              <ul className="space-y-3">
                {subtasks.map((st) => (
                  <li key={st.id || st._id} className="flex items-center justify-between border border-gray-200 bg-white rounded-lg p-3 sm:p-4 hover:shadow-sm group transition-all">
                    <div className="flex flex-col gap-1 mr-4">
                      <span className={`font-medium text-sm ${st.isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{st.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => handleToggleSubtask(st.id || st._id)} disabled={!canManage} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${!canManage ? 'cursor-default' : 'hover:opacity-80'} ${st.isCompleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {st.isCompleted ? <><CheckCircleIcon className="w-4 h-4" />Done</> : <><XCircleIcon className="w-4 h-4" />Todo</>}
                      </button>
                      {canManage && (
                        <button className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => { e.stopPropagation(); handleDeleteSubtask(st.id || st._id); }} title="Delete">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">
              Comments ({comments.length})
            </h2>

            {/* Add comment */}
            <div className="mb-6 flex gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                    {user?.name?.[0] || "U"}
                </div>
                <div className="flex-1">
                    <textarea
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isPostingComment}
                    />
                    <div className="mt-2 flex justify-end">
                        <button
                         className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                         onClick={handlePostComment}
                          disabled={isPostingComment || !newComment.trim()}
                         >
                        {isPostingComment ? "Posting..." : "Post Comment"}
                        </button>
                    </div>
                </div>
            </div>

            {comments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No comments yet.</p>
            ) : (
              <ul className="space-y-4">
                {comments.map((c) => (
                  <li key={c.id || c._id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-gray-200 text-[10px] flex items-center justify-center font-bold text-gray-600">
                        {c.authorInitials || (c.userID?.name ? c.userID.name[0] : "?")}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {c.authorName || c.userID?.name || "Unknown User"}
                      </span>
                      
                      {c.createdAt && (
                        <span className="text-xs text-gray-400">
                          •{" "}
                          {new Date(c.createdAt).toLocaleDateString("en-GB", {
                           day: "numeric", month: "short", hour: "2-digit", minute:"2-digit"
                          })}
                        </span>
                      )}
                    </div>
                    <div className="pl-8">
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg rounded-tl-none inline-block">
                            {c.content}
                        </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* RIGHT: Properties */}
        <div className="space-y-6">

          {/* Properties Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4">Properties</h2>
            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs flex items-center gap-1">
                    <UserIcon className="w-3 h-3"/> Assignee
                </span>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {task.assigneeName ? task.assigneeName[0] : "?"}
                    </div>
                    <span className="font-medium text-gray-900">{task.assigneeName || "Unassigned"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs flex items-center gap-1">
                    <CalendarIcon className="w-3 h-3"/> Due date
                </span>
                <span className="font-medium text-gray-900">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                    : "No due date"}
                </span>
              </div>

              {/* Labels (Tạm ẩn nếu chưa có) */}
              <div className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs flex items-center gap-1">
                    <TagIcon className="w-3 h-3"/> Labels
                </span>
                <div className="flex flex-wrap gap-1">
                    {(task.labels && task.labels.length > 0) ? task.labels.map((l, i) => (
                         <span key={i} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{l}</span>
                    )) : <span className="text-gray-400 italic">None</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Attachments</h2>
              {canManage && <button className="text-xs text-blue-600 font-medium hover:underline">+ Add</button>}
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No files attached.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {attachments.map((a) => (
                  <li key={a.id || a._id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[150px]"
                    >
                      {a.title || a.url}
                    </a>
                    {canManage && (
                      <button className="text-xs text-red-500 hover:text-red-700">
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
      {/* === EDIT TASK MODAL (Thêm mới đoạn này vào cuối) === */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
              <button type="button" onClick={() => setIsEditOpen(false)} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
                <XMarkIcon className="w-5 h-5"/>
              </button>
            </div>
            
            <form onSubmit={handleUpdateTask} className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={editForm.title} 
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                    required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                    rows={4} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={editForm.description} 
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" 
                    value={editForm.assigneeId} 
                    onChange={(e) => setEditForm({...editForm, assigneeId: e.target.value})}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>

                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                   <select 
                     className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                     value={editForm.status}
                     onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                   >
                     <option value="BACKLOG">Backlog</option>
                     <option value="TODO">Todo</option>
                     <option value="DOING">In Progress</option>
                     <option value="DONE">Done</option>
                   </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" 
                    value={editForm.priority} 
                    onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" 
                    value={editForm.dueDate} 
                    onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})} 
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;