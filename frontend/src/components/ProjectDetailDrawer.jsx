import React, { useState, useEffect } from 'react';
import { 
    XMarkIcon, 
    Squares2X2Icon, 
    UsersIcon, 
    CalendarDaysIcon,
    BriefcaseIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon 
} from '@heroicons/react/24/outline';
import ReactECharts from 'echarts-for-react'; 
import { formatDistanceToNow } from 'date-fns';
import ChatBox from './ChatBox'; 
import { useAuth } from '../services/AuthContext'; 

const API_BASE_URL = 'http://localhost:4000/api';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

// --- Helper: Circular Progress Component ---
const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, color = "#facc15" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="#f3f4f6" strokeWidth={strokeWidth} fill="transparent"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke={color} strokeWidth={strokeWidth} fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TAB DASHBOARD ---
const ProjectDashboardTab = ({ projectId }) => {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [summaryRes, activityRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/projects/${projectId}/summary`, { headers: getHeaders() }),
                    fetch(`${API_BASE_URL}/projects/${projectId}/activities?limit=20`, { headers: getHeaders() })
                ]);

                const summaryData = await summaryRes.json();
                const activityData = await activityRes.json();

                if (summaryData.success) setStats(summaryData.data);
                if (activityData.success) setActivities(activityData.data || []);
            } catch (error) {
                console.error("Error fetching dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [projectId]);

    if (loading) return <div className="p-20 text-center text-gray-500">Loading dashboard...</div>;
    if (!stats) return <div className="p-20 text-center text-gray-500">No data available.</div>;

    const chartOption = {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%', left: 'center' },
        series: [{
            name: 'Tasks',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: '20', fontWeight: 'bold' } },
            data: [
                { value: stats.todo, name: 'Todo', itemStyle: { color: '#fb923c' } },
                { value: stats.doing, name: 'Doing', itemStyle: { color: '#3b82f6' } },
                { value: stats.done, name: 'Done', itemStyle: { color: '#22c55e' } }
            ]
        }]
    };

    const overallProgress = stats.totalTasks > 0 
        ? Math.round((stats.done / stats.totalTasks) * 100) 
        : 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-down h-full pb-6">
            {/* Cột trái: Chart và Stats */}
            <div className="md:col-span-2 space-y-6 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                 {/* Overview Cards */}
                 <div className="grid grid-cols-3 gap-4">
                    <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 text-center shadow-sm">
                        <p className="text-xs text-orange-600 uppercase font-bold tracking-wider">Total Tasks</p>
                        <p className="text-3xl font-extrabold text-gray-800 mt-2">{stats.totalTasks}</p>
                    </div>
                    <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center shadow-sm">
                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Completed</p>
                        <p className="text-3xl font-extrabold text-gray-800 mt-2">{stats.done}</p>
                    </div>
                    <div className="bg-red-50 p-5 rounded-2xl border border-red-100 text-center shadow-sm">
                        <p className="text-xs text-red-600 uppercase font-bold tracking-wider">Overdue</p>
                        <p className="text-3xl font-extrabold text-gray-800 mt-2">{stats.overdue || 0}</p>
                    </div>
                </div>

                {/* --- Xếp dọc --- */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Task Distribution */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-4 text-lg">Task Distribution</h4>
                        <div className="h-64">
                            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
                        </div>
                    </div>

                    {/* Overall Progress */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <h4 className="font-bold text-gray-800 mb-6 text-lg w-full text-left">Overall Progress</h4>
                        <div className="mb-4">
                            <CircularProgress percentage={overallProgress} size={160} strokeWidth={12} color={overallProgress === 100 ? "#22c55e" : "#facc15"} />
                        </div>
                        <p className="text-gray-500 text-sm">
                            {stats.done} out of {stats.totalTasks} tasks completed
                        </p>
                    </div>
                </div>
            </div>

            {/* Cột phải: Activity */}
            <div className="md:col-span-1 bg-gray-50 rounded-2xl border border-gray-100 h-full flex flex-col overflow-hidden" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                <div className="p-6 pb-2 bg-gray-50 z-10">
                    <h4 className="font-bold text-gray-800 text-lg">Recent Activity</h4>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4" 
                     style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}> 
                    
                    <style>{`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>

                    <div className="no-scrollbar space-y-4">
                        {activities.length > 0 ? activities.map((act) => (
                            <div key={act._id} className="flex gap-3 items-start p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-md">
                                    {act.userId?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-800 leading-snug">
                                        <span className="font-bold">{act.userId?.name}</span> {act.content || act.action}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {act.createdAt ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true }) : ''}
                                    </p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-500 italic text-center py-10">No recent activity.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: TAB MEMBERS ---
const ProjectMembersTab = ({ projectId }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/projects/${projectId}/members`, { headers: getHeaders() });
                const data = await res.json();
                if (data.success) {
                    setMembers(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching members:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [projectId]);

    if (loading) return <div className="p-20 text-center text-gray-500">Loading members...</div>;

    return (
        <div className="animate-fade-in-down pb-10">
            <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-3 text-lg">
                Team Members
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">{members.length}</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((m) => (
                    <div key={m._id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow hover:border-[var(--color-brand)] group cursor-default">
                        <div className="flex items-center gap-4">
                            {m.user?.avatar ? (
                                <img src={m.user.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"/>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 text-gray-600 flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                                    {m.user?.name?.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="text-base font-bold text-gray-900 group-hover:text-[var(--color-brand)] transition-colors">{m.user?.name}</p>
                                <p className="text-xs text-gray-500">{m.user?.email}</p>
                            </div>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide ${
                            m.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            m.role === 'Manager' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {m.role}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN DRAWER COMPONENT (MODAL STYLE) ---
const ProjectDetailDrawer = ({ isOpen, onClose, project }) => {
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const { user } = useAuth(); // Lấy user hiện tại
    const [isChatOpen, setIsChatOpen] = useState(false); // State quản lý bật tắt chat box

    useEffect(() => {
        if (isOpen) {
            setActiveTab('dashboard');
            setIsChatOpen(false); // Reset chat khi mở project mới
        }
    }, [isOpen, project]);

    if (!isOpen || !project) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative bg-white w-full max-w-6xl h-[85vh] md:h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-gray-900/5">
                
                {/* Header */}
                <div className="px-8 py-6 bg-white border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-[var(--color-brand)]/10 rounded-lg text-[var(--color-brand)]">
                                <BriefcaseIcon className="w-7 h-7" />
                            </div>
                            {project.name}
                        </h2>
                        <p className="text-gray-500 mt-2 ml-1 text-sm max-w-2xl line-clamp-2">{project.description || 'No description provided for this project.'}</p>
                    </div>

                    {/* ACTIONS: CHAT & CLOSE */}
                    <div className="flex items-center gap-2">
                        {/* Nút Chat cho Admin (hoặc hiển thị cho tất cả nếu muốn) 
                            Logic ở đây: Nếu là Admin -> Hiện nút này vì Admin ko có Navbar Chat
                        */}
                        {user?.role === 'Admin' && (
                            <button 
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className={`p-2 rounded-full transition-colors flex items-center gap-2 px-4 border ${isChatOpen ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                <span className="text-sm font-bold">Project Chat</span>
                            </button>
                        )}

                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <XMarkIcon className="w-8 h-8" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8 border-b border-gray-100 flex gap-8 bg-white shrink-0">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`py-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                            activeTab === 'dashboard' ? 'text-[var(--color-brand)]' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <Squares2X2Icon className="w-5 h-5" /> Dashboard
                        {activeTab === 'dashboard' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[var(--color-brand)] rounded-t-full"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('members')}
                        className={`py-4 text-sm font-bold flex items-center gap-2 transition-all relative ${
                            activeTab === 'members' ? 'text-[var(--color-brand)]' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <UsersIcon className="w-5 h-5" /> Members
                        {activeTab === 'members' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[var(--color-brand)] rounded-t-full"></span>}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden p-8 bg-gray-50/50 relative"> 
                    {/* Render ChatBox đè lên content nếu đang mở */}
                    {isChatOpen && (
                        <ChatBox 
                            projectId={project.id || project._id}
                            projectName={project.name}
                            currentUser={user}
                            onClose={() => setIsChatOpen(false)}
                        />
                    )}

                    {activeTab === 'dashboard' ? (
                        <ProjectDashboardTab projectId={project.id || project._id} />
                    ) : (
                        <div className="h-full overflow-y-auto custom-scrollbar pr-2">
                            <ProjectMembersTab projectId={project.id || project._id} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 bg-white flex justify-between items-center text-xs text-gray-400 shrink-0">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">ID: {project.id || project._id}</span>
                    {project.deadline && (
                        <span className="flex items-center gap-2 font-medium text-gray-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                            <CalendarDaysIcon className="w-4 h-4 text-orange-500"/> Deadline: {new Date(project.deadline).toLocaleDateString()}
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ProjectDetailDrawer;