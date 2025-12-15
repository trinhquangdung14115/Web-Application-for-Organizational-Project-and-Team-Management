import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { formatDistanceToNow } from 'date-fns';
import axiosInstance from '../services/api';
import { getProjects } from "../services/projectService"; // 🔵 Thêm
import TaskSummary from '../components/TaskSummary';
import { ChevronDownIcon, SparklesIcon,XMarkIcon, 
  LightBulbIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  CheckCircleIcon as DoneIcon,
  ExclamationTriangleIcon, FolderIcon } from '@heroicons/react/24/outline';

// ==================================================================================
// 🔵 AI DAILY WIDGET COMPONENT
// ==================================================================================
const AIDailyWidget = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyBrief = async () => {
      try {
        setLoading(true);
        // Gọi Mock API
        const response = await axiosInstance.get('/ai/daily-brief');
        if (response.data && response.data.success) {
          setData(response.data.data);
        } else {
          setError("Không thể tải dữ liệu.");
        }
      } catch (err) {
        console.error("AI Brief Error:", err);
        setError("Lỗi kết nối đến AI Service.");
      } finally {
        setLoading(false);
      }
    };

    fetchDailyBrief();
    }, []);
    return (
     <div className="fixed bottom-24 right-6 z-50 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[70vh] animate-in slide-in-from-bottom-5 fade-in duration-200 origin-bottom-right">
      
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3b064d] to-[#f35640] p-4 flex justify-between items-center text-white shrink-0 shadow-md">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 animate-pulse text-yellow-300" />
            <h3 className="font-bold text-lg tracking-wide">Today's Work</h3>
          </div>
          
           
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gray-50/50 h-full">
          {loading ? (
            // --- SKELETON LOADING UI ---
            <div className="space-y-5 animate-pulse">
              <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-16 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-16 bg-gray-200 rounded-lg w-full"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">
              <ExclamationTriangleIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{error}</p>
              <button onClick={onClose} className="mt-4 text-sm font-semibold underline text-gray-500">Close</button>
            </div>
          ) : (
            // --- MAIN CONTENT ---
            <div className="space-y-6">
              
              {/* Greeting */}
              <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#f35640]"></div>
                <p className="text-gray-800 font-medium leading-relaxed text-base">
                  {data.greeting}
                </p>
              </div>

              {/* Task Highlights */}
              {data.task_highlights && data.task_highlights.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <LightBulbIcon className="w-4 h-4 text-yellow-500" /> Focus Today
                  </h4>
                  <div className="space-y-3">
                    {data.task_highlights.map((task, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors shadow-sm group">
                        <div className="flex gap-3 items-start">
                          <CheckCircleIcon className="w-5 h-5 text-gray-400 mt-0.5 group-hover:text-indigo-600 transition-colors shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-gray-800">{task.title}</p>
                              {task.label && (
                                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium border border-gray-200">
                                  {task.label}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">{task.summary}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meetings */}
              {data.upcoming_meetings && data.upcoming_meetings.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-purple-500" /> Meetings
                  </h4>
                  <div className="space-y-2">
                    {data.upcoming_meetings.map((meet, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-sm font-medium text-gray-700">{meet.title}</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                          {meet.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Encouragement */}
              <div className="text-center pt-4 border-t border-gray-200 mt-2">
                <p className="text-sm text-gray-500 italic">"{data.encouragement}"</p>
              </div>

            </div>
          )}
        </div>
      </div>
    
  );
};


const HomePage = () => {

  const { dynamicTasksSummary } = useOutletContext();



  // ----------------------------------------------------------
  // 🔵 STATE THÊM MỚI
  // ----------------------------------------------------------
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  // ----------------------------------------------------------

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIBrief, setShowAIBrief] = useState(false);

  // ----------------------------------------------------------
  // 🔵 LOAD DANH SÁCH PROJECTS
  // ----------------------------------------------------------
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const list = await getProjects();
        setProjects(list);

        if (list.length > 0) {
         // Ưu tiên lấy _id, nếu không có thì thử id (đề phòng backend trả về id ảo)
         const firstId = list[0]._id || list[0].id; 
         console.log(">>> Chọn Project ID mặc định:", firstId); // Log để kiểm tra
         setCurrentProjectId(firstId);
        }
      } catch (error) {
        console.error("Failed to load projects", error);
      }
    };

    loadProjects();
  }, []);
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  // 🔵 LOAD SUMMARY + ACTIVITY MỖI KHI currentProjectId THAY ĐỔI
  // ----------------------------------------------------------
  useEffect(() => {
    if (!currentProjectId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, activityRes] = await Promise.all([
          axiosInstance.get(`/projects/${currentProjectId}/summary`),
          axiosInstance.get(`/projects/${currentProjectId}/activities`)
        ]);

        console.log(" Raw summaryRes:", summaryRes.data);
        console.log(" Nested data:", summaryRes.data.data);
        console.log(" tasksByStatus:", summaryRes.data.data?.tasksByStatus);

        setStats(summaryRes.data.data);
        setActivities(activityRes.data.data || []);

      } catch (error) {
        console.error("Error:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentProjectId]);
  // ----------------------------------------------------------



  // --- CONFIG HELPER CHO CHART & COLOR ---
  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'done') return { color: '#22c55e', tailwind: 'bg-green-500', label: 'Completed' };
    if (s === 'in-progress' || s === 'doing') return { color: '#3b82f6', tailwind: 'bg-blue-500', label: 'In Progress' };
    if (s === 'todo') return { color: '#fb923c', tailwind: 'bg-orange-400', label: 'Todo' };
    return { color: '#9ca3af', tailwind: 'bg-gray-400', label: status };
  };
useEffect(() => {
  if (!currentProjectId) return;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, activityRes] = await Promise.all([
        axiosInstance.get(`/projects/${currentProjectId}/summary`),
        axiosInstance.get(`/projects/${currentProjectId}/activities`)
      ]);

      // Lưu đúng data nested
      setStats(summaryRes.data.data);  // Lấy nested "data"
      setActivities(activityRes.data.data || []);  // Lấy nested "data"

      console.log("Stats loaded:", summaryRes.data.data);
      console.log("Activities loaded:", activityRes.data.data);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [currentProjectId]);useEffect(() => {
  if (!currentProjectId) return;

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, activityRes] = await Promise.all([
        axiosInstance.get(`/projects/${currentProjectId}/summary`),
        axiosInstance.get(`/projects/${currentProjectId}/activities`)
      ]);

      //  Lưu đúng data nested
      setStats(summaryRes.data.data);  // Lấy nested "data"
      setActivities(activityRes.data.data || []);  // Lấy nested "data"

      console.log("Stats loaded:", summaryRes.data.data);
      console.log("Activities loaded:", activityRes.data.data);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [currentProjectId]);
  const getPriorityConfig = (priority) => {
    const p = priority?.toLowerCase();
    if (p === 'high') return 'bg-red-500';
    if (p === 'medium') return 'bg-orange-500';
    return 'bg-green-500';
  };

  // --- CHART CONFIG ---
  const getChartOption = () => {
  // Kiểm tra đúng path
  if (!stats || !stats.tasksByStatus) {
    console.log("No tasksByStatus found in stats:", stats);
    return {
      title: { 
        text: 'No Tasks', 
        left: 'center', 
        top: 'center', 
        textStyle: { color: '#ccc', fontSize: 14 } 
      },
      series: [{ 
        type: 'pie', 
        radius: ['65%', '90%'], 
        data: [{ value: 0, name: '', itemStyle: { color: '#f3f4f6' } }] 
      }]
    };
  }
  

  // Đọc đúng field (sau khi đã lưu stats = summaryRes.data.data)
  const data = [
    { value: stats.todo || 0, name: 'Todo', itemStyle: { color: '#fb923c' } },
    { value: stats.doing || 0, name: 'Doing', itemStyle: { color: '#3b82f6' } },
    { value: stats.done || 0, name: 'Done', itemStyle: { color: '#22c55e' } },
  ];

  const validData = data.filter(item => item.value > 0);

  if (validData.length === 0) {
    return {
      title: { 
        text: 'No Tasks', 
        left: 'center', 
        top: 'center', 
        textStyle: { color: '#ccc', fontSize: 14 } 
      },
      series: [{ 
        type: 'pie', 
        radius: ['65%', '90%'], 
        data: [{ value: 0, name: '', itemStyle: { color: '#f3f4f6' } }] 
      }]
    };
  }

  return {
    tooltip: { trigger: 'item' },
    series: [
      {
        name: 'Tasks',
        type: 'pie',
        radius: ['65%', '90%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: validData
      }
    ]
  };
  
};


  return (
    <div className="p-6 space-y-6">

      
      {/* Filter + Export */}
      
      <div className="flex items-center justify-end gap-3">
       
        <div className='relative'>
            <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
         <select
          className="border border-gray-300 pl-9 px-2 py-2 rounded-lg appearance-none cursor-pointer"
          value={currentProjectId || ""}
          onChange={(e) => setCurrentProjectId(e.target.value)}
        >
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        <div className='relative'>
        <select className="border border-gray-300 rounded-lg px-7 py-2 text-gray-700 appearance-none cursor-pointer">
          <option>This month</option>
          <option>Last month</option>
          <option>This week</option>
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-brand)] text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity">
          Export report
        </button>
      </div>

      {/* Task Summary */}
      <TaskSummary summaryData={dynamicTasksSummary} />

      {/* --------- MAIN GRID --------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Status */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Project Status</h2>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Loading chart...</div>
          ) : (stats && stats.tasksByStatus && stats.tasksByStatus.length > 0) ? (  // ✅ Kiểm tra đúng
            <>
              <div className="flex items-center justify-center h-48">
                <ReactECharts 
                  option={getChartOption()} 
                  style={{ height: '100%', width: '100%' }}
                />
              </div>

              <ul className="mt-5 space-y-2 text-gray-600">
                {stats.tasksByStatus.map((item) => {
                   const config = getStatusConfig(item._id);
                   const percent = stats.totalTasks ? Math.round((item.count / stats.totalTasks) * 100) : 0;
                   return (
                    <li key={item._id} className="flex justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${config.tailwind}`}></span> 
                        {config.label}
                      </span>
                      <span>{item.count} ({percent}%)</span>
                    </li>
                   );
                })}
              </ul>
            </>
          ) : (
            <div className="text-center text-gray-500 py-10">No tasks data available</div>
          )}
        </div>

        {/* Priority */}
        <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Task Priority</h2>
          
          {loading ? (
             <p className="text-gray-400">Loading priorities...</p>
          ) : (stats && stats.priority) ? (
             <>
                <Priority label="High" count={stats.priority.high || 0} total={stats.totalTasks} color="bg-red-500" />
                <Priority label="Medium" count={stats.priority.medium || 0} total={stats.totalTasks} color="bg-orange-500" />
                <Priority label="Low" count={stats.priority.low || 0} total={stats.totalTasks} color="bg-green-500" />
             </>
          ) : (
            <p className="text-center text-gray-500 mt-10">No priority data</p>
          )}
        </div>

      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <button className="text-blue-500 text-sm hover:underline">View all activity</button>
        </div>

        <div className="space-y-4">
          {loading ? (
             <p className="text-gray-400 text-sm">Loading activities...</p>
          ) : activities.length > 0 ? (
            activities.slice(0, 5).map((act) => (
              <div key={act._id} className="flex items-start gap-3">
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full font-bold uppercase text-sm">
                  {act.userId?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{act.userId?.name || "Unknown"}</span> 
                    {' '}{act.text || act.action || "updated a task"} 
                    {act.taskName && <strong> "{act.taskName}"</strong>}
                  </p>
                  <p className="text-xs text-gray-500">
                    {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activities found.</p>
          )}
        </div>
      </div>
      {/* 🔵 AI Widget */}
      {showAIBrief && (
        <AIDailyWidget onClose={() => setShowAIBrief(false)} />
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAIBrief(!showAIBrief)}
        className="fixed bottom-6 right-6 z-50 p-5 bg-gradient-to-r from-[#3b064d] to-[#f35640] text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group ring-4 ring-white/50"
        title="AI Daily Brief"
      >
        {showAIBrief ? (
             <XMarkIcon className="w-6 h-6" />
        ) : (
             <SparklesIcon className="w-6 h-6 text-yellow-300 group-hover:animate-pulse" />
        )}
      </button>


    </div>
  );
};

// --- Component con để render (Clean code) ---

const StatusItem = ({ label, count, total, color }) => {
    const val = count || 0;
    const percent = total > 0 ? Math.round((val / total) * 100) : 0;
    return (
        <li className="flex justify-between text-sm">
            <span className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${color}`}></span> {label}
            </span>
            <span>{val} ({percent}%)</span>
        </li>
    );
}

const Priority = ({ label, count, total, color }) => {
  const val = count || 0;
  const percent = total > 0 ? Math.round((val / total) * 100) : 0;
  return (
    <div className="mb-6 last:mb-0">
        <div className="flex justify-between mb-1 text-sm text-gray-600">
        <span>{label}</span>
        <span>{val} ({percent}%)</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full">
        <div className={`h-3 ${color} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
        </div>
    </div>
  );
};

export default HomePage;