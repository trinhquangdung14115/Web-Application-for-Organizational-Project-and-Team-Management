import React, { useEffect, useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { formatDistanceToNow } from 'date-fns';
import axiosInstance from '../services/api';
import { getProjects } from "../services/projectService";
import TaskSummary from '../components/TaskSummary';
import { ChevronDownIcon, SparklesIcon,XMarkIcon, 
  LightBulbIcon, 
  CalendarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon, 
  ClipboardDocumentListIcon as TotalSolid, 
  ClockIcon as ClockSolid, 
  ArrowPathIcon as ProgressSolid, 
  CheckCircleIcon as DoneSolid,
  ExclamationTriangleIcon as WarningSolid, } from '@heroicons/react/24/outline';
import { Card, Row, Col, Statistic, Progress, List, Tag, Spin } from "antd";
import { 
  ProjectOutlined, TeamOutlined, CheckCircleOutlined as AntCheckCircleOutlined,  LoadingOutlined 
} from "@ant-design/icons";
import dashboardService from "../services/dashboardService";
import { useProject } from '../context/ProjectContext';

// AI DAILY WIDGET COMPONENT
const AIDailyWidget = ({ onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDailyBrief = async () => {
      try {
        setLoading(true);
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
            // SKELETON LOADING UI 
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
            // MAIN CONTENT 
            <div className="space-y-6">
              
              {/* Greeting */}
              <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#f35640]"></div>
                <p className="text-gray-800 font-medium leading-relaxed text-base">
                  {data?.greeting || "Hello There"}
                </p>
              </div>

              {/* Task Highlights */}
              {data?.task_highlights && data?.task_highlights?.length > 0 && (
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
              {data?.upcoming_meetings && data?.upcoming_meetings?.length > 0 && (
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

const formatActivityContent = (act) => {
  const userName = act.userId?.name || "Unknown User";
  
  //  Content 
  if (act.content && act.content.length > 5 && !act.content.match(/^(created|updated|deleted|reordered)/i)) {
      return (
          <span>
              <span className="font-semibold text-gray-900">{userName}</span> {act.content}
          </span>
      );
  }

  //  Map Action
  let actionText = "performed an action";
  switch (act.action) {
      case "CREATE_PROJECT": actionText = "created project"; break;
      case "UPDATE_PROJECT": actionText = "updated project settings"; break;
      case "DELETE_PROJECT": actionText = "deleted project"; break;
      case "ARCHIVE_PROJECT": actionText = "archived project"; break;
      case "JOIN_PROJECT": actionText = "joined the project"; break;
      case "LEAVE_PROJECT": actionText = "left the project"; break;
      
      case "CREATE_TASK": actionText = "created task"; break;
      case "UPDATE_TASK": actionText = "updated task"; break;
      case "DELETE_TASK": actionText = "deleted task"; break;
      case "COMPLETE_TASK": actionText = "completed task"; break;
      case "REORDER_TASK": actionText = "reordered task"; break;
      case "CREATE_SUBTASK": actionText = "created subtask"; break;
  }

  //  Entity Name từ Metadata
  let entityName = "";
  if (act.metadata?.snapshot) {
      entityName = act.metadata.snapshot.title || act.metadata.snapshot.name || "";
  } else if (act.metadata?.changes) {
      const nameChange = act.metadata.changes.find(c => c.field === 'name' || c.field === 'title');
      if (nameChange) entityName = nameChange.new;
      
      const statusChange = act.metadata.changes.find(c => c.field === 'status');
      if (statusChange) actionText = `moved task to ${statusChange.new}`;
  }
  
  if (!entityName && act.content) {
      const match = act.content.match(/"([^"]+)"/);
      if (match) entityName = match[1];
  }

  return (
      <span>
          <span className="font-semibold text-gray-900">{userName}</span> {actionText} 
          {entityName && <span className="font-semibold text-brand"> "{entityName}"</span>}
      </span>
  );
};

const HomePage = () => {
  const { selectedProjectId } = useProject();
  const { dynamicTasksSummary } = useOutletContext() || {};
  // State cho User Role và Dashboard Data 
  const [user, setUser] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [managerStats, setManagerStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
// State để xác định User đang xem Dashboard với tư cách gì (Admin/Manager/Member)
  const [dashboardViewRole, setDashboardViewRole] = useState(null);

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIBrief, setShowAIBrief] = useState(false);

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Lấy User từ LocalStorage để phân quyền
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
     const parsedUser = JSON.parse(storedUser);
      console.log("CURRENT USER:", parsedUser); // Debug: Xem Role là gì
      setUser(parsedUser);
    }
  }, []);

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      
      // Reset data cũ để tránh hiển thị nhầm trong lúc loading
      setAdminStats(null);
      setManagerStats(null);
      setMemberStats(null);
      setActivities([]);

      try {
        const projectIdParam = selectedProjectId || 'all';

        // CASE 1: ADMIN (Luôn xem Admin Dashboard)
        if (user.role === 'Admin') {
          setDashboardViewRole('Admin');
          const data = await dashboardService.getAdminStats(projectIdParam, selectedMonth, selectedYear);
          setAdminStats(data);
          setActivities(data.activities || []);
        }
        
        // CASE 2: MANAGER HOẶC MEMBER (Cần kiểm tra quyền trong Project)
        else {
          // Thử lấy Manager Stats trước để xem User có quyền quản lý project này không
          // (API getManagerStats sẽ trả về kpi.myProjects = 0 nếu không phải Manager)
          const managerData = await dashboardService.getManagerStats(projectIdParam, selectedMonth, selectedYear);
          
          // Kiểm tra quyền: Nếu myProjects > 0 -> Có quyền Manager trong project/context này
          const isManagerInContext = managerData?.kpi?.myProjects > 0;

          if (isManagerInContext) {
            setDashboardViewRole('Manager');
            setManagerStats(managerData);
            setActivities(managerData.activities || []);
          } else {
            // Nếu không phải Manager -> Chuyển sang Member View và lấy Member Stats
            setDashboardViewRole('Member');
            const memberData = await dashboardService.getMemberStats(projectIdParam, selectedMonth, selectedYear);
            setMemberStats(memberData);
            setActivities(memberData.activities || []);
          }
        }

      } catch (error) {
        console.error("Dashboard Service Error:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user, selectedProjectId, selectedMonth, selectedYear]); 


  useEffect(() => {
    if (selectedProjectId === 'all' || !selectedProjectId) {
        setStats(null);
        return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const summaryRes = await axiosInstance.get(`/projects/${selectedProjectId}/summary`);
        setStats(summaryRes.data.data);
      } catch (error) {
        console.error("Error fetching legacy stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedProjectId,user]);

  // CONFIG HELPER CHO CHART & COLOR 
  const getStatusConfig = (status) => {
    const s = status?.toLowerCase();
    if (s === 'completed' || s === 'done') return { color: '#22c55e', tailwind: 'bg-green-500', label: 'Completed' };
    if (s === 'in-progress' || s === 'doing') return { color: '#3b82f6', tailwind: 'bg-blue-500', label: 'In Progress' };
    if (s === 'todo') return { color: '#fb923c', tailwind: 'bg-orange-400', label: 'Todo' };
    return { color: '#9ca3af', tailwind: 'bg-gray-400', label: status };
  };

  // CHART CONFIG 
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
// Helpers cho biểu đồ mới (Admin/Manager)
  const getAdminPieOption = () => ({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    color: ['#f35640', '#faad14', '#52c41a'],
    series: [{
        name: 'Project Status', type: 'pie', radius: ['50%', '70%'],
        avoidLabelOverlap: false, label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: adminStats?.charts?.projectStatus || []
    }]
  });

  const getAdminBarOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', minInterval: 1, boundaryGap: [0, 0.01] },
    yAxis: { type: 'category', data: adminStats?.charts?.priorityDistribution?.map(i => i.name) || [] },
    series: [{
        name: 'Tasks', type: 'bar',
        data: adminStats?.charts?.priorityDistribution?.map(i => i.value) || [],
        itemStyle: { color: '#3b064d', borderRadius: [0, 4, 4, 0] }
    }]
  });

  const getManagerBarOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', minInterval: 1, boundaryGap: [0, 0.01] },
    yAxis: { type: 'category', data: managerStats?.charts?.priorityDistribution?.map(i => i.name) || [] },
    series: [{
        name: 'Tasks', type: 'bar',
        data: managerStats?.charts?.priorityDistribution?.map(i => i.value) || [],
        itemStyle: { color: '#f35640', borderRadius: [0, 4, 4, 0] }
    }]
  });

  const getMemberBarOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', minInterval: 1, boundaryGap: [0, 0.01] },
    yAxis: { type: 'category', data: memberStats?.charts?.priorityDistribution?.map(i => i.name) || [] },
    series: [{
        name: 'Tasks', type: 'bar',
        data: memberStats?.charts?.priorityDistribution?.map(i => i.value) || [],
        itemStyle: { color: '#f35640', borderRadius: [0, 4, 4, 0] }
    }]
  });

  //  MEMBER PIE CHART OPTION (Dùng dữ liệu memberStats)
  const getMemberPieOption = () => {
    if (!memberStats || !memberStats.kpi) return {
      title: { text: 'No Data', left: 'center', top: 'center', textStyle: { color: '#ccc', fontSize: 14 } },
      series: [{ type: 'pie', radius: ['65%', '90%'], data: [{ value: 0, name: '', itemStyle: { color: '#f3f4f6' } }] }]
    };

    const { todoTasks, doingTasks, doneTasks } = memberStats.kpi;
    const data = [
      { value: todoTasks || 0, name: 'Todo', itemStyle: { color: '#fb923c' } },
      { value: doingTasks || 0, name: 'Doing', itemStyle: { color: '#3b82f6' } },
      { value: doneTasks || 0, name: 'Done', itemStyle: { color: '#22c55e' } },
    ];
    const validData = data.filter(item => item.value > 0);

    return {
      tooltip: { trigger: 'item' },
      series: [{
        name: 'My Tasks', type: 'pie', radius: ['60%', '90%'], avoidLabelOverlap: false, label: { show: false },
        data: validData.length ? validData : [{ value: 0, name: '', itemStyle: { color: '#f3f4f6' } }]
      }]
    };
  };

  //  CONFIG BIỂU ĐỒ CỘT (WEEKLY ACTIVITY)
   const getWeeklyActivityOption = () => ({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: memberStats?.charts?.taskActivity?.map(d => d.name) || [] },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ 
        name: 'Tasks', type: 'bar', barWidth: '40%', 
        data: memberStats?.charts?.taskActivity?.map(d => d.value) || [],
        itemStyle: { color: '#f35640', borderRadius: [4, 4, 0, 0] }
    }]
  });
  // RENDER HELPERS: Sử dụng dashboardViewRole thay vì user.role 
  const isAdminView = dashboardViewRole === 'Admin';
  const isManagerView = dashboardViewRole === 'Manager';
  const isMemberView = dashboardViewRole === 'Member';
  
  // Xử lý khi chọn dropdown gộp Month/Year
  const handleDateChange = (e) => {
    const value = e.target.value;
    if (!value) return;
    
    // Tách chuỗi "10-2025" -> month=10, year=2025
    const [m, y] = value.split('-');
    if (m && y) {
        setSelectedMonth(Number(m));
        setSelectedYear(Number(y));
    }
  };

  // Helper: Tạo danh sách tháng/năm cho dropdown
  // Tạo 12 tháng cho 2 năm gần nhất (Năm nay và năm ngoái)
  const generateMonthYearOptions = () => {
    const options = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    
    // Năm hiện tại: Từ tháng hiện tại trở về tháng 1
    for (let month = currentMonth; month >= 1; month--) {
        options.push({
            value: `${month}-${currentYear}`,
            label: `Month ${month}/${currentYear}`
        });
    }

    // Năm ngoái: Lấy cả 12 tháng
    const lastYear = currentYear - 1;
    for (let month = 12; month >= 1; month--) {
        options.push({
            value: `${month}-${lastYear}`,
            label: `Month ${month}/${lastYear}`
        });
    }

    return options;
  };

  const monthYearOptions = generateMonthYearOptions();


// Helper chuyển đổi Object số liệu thành Array cho TaskSummary Component
  const formatTaskSummaryData = (data) => {
    if (!data) return [];
    // Nếu đã là Array (ví dụ dynamicTasksSummary) thì trả về luôn
    if (Array.isArray(data)) return data;

    // Mapping từ Object (keys backend trả về) sang Array (UI yêu cầu)
    // Hỗ trợ cả 2 dạng key: 'todo' và 'todoTasks'
    const total = data.totalTasks ?? data.total ?? 0;
    const todo = data.todoTasks ?? data.todo ?? 0;
    const doing = data.doingTasks ?? data.doing ?? 0;
    const done = data.doneTasks ?? data.done ?? 0;
    const overdue = data.overdueTasks ?? data.overdue ?? 0;

   return [
        { number: total,   label: 'Total',       icon: <TotalSolid />,    iconColor: '#3f8600',      textColor: 'text-gray-800' },
        { number: todo,    label: 'Todo',        icon: <ClockSolid />,    iconColor: '#3f8600',      textColor: 'text-gray-800' },
        { number: doing,   label: 'In Progress', icon: <ProgressSolid />, iconColor: '#3f8600',      textColor: 'text-gray-800' },
        { number: done,    label: 'Done',        icon: <AntCheckCircleOutlined />,     iconColor: '#3f8600',    textColor: 'text-gray-800' },
        { number: overdue, label: 'Overdue',     icon: <WarningSolid />,  iconColor: '#3f8600',  textColor: 'text-gray-800' },
    ];
  };

  //PREPARE DATA FOR MEMBER SUMMARY (Mapping từ memberStats)
  const memberSummaryData = memberStats?.kpi 
    ? formatTaskSummaryData(memberStats.kpi) 
    : dynamicTasksSummary;

  const managerSummaryData = managerStats?.kpi?.taskSummary
    ? formatTaskSummaryData(managerStats.kpi.taskSummary)
    : dynamicTasksSummary;  

  if (dashboardLoading) {
      // Tạo icon loading màu cam
      const antIcon = <LoadingOutlined style={{ fontSize: 48, color: '#f35640' }} spin />;
      return <div className="flex h-screen items-center justify-center"><Spin indicator={antIcon} /></div>;
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      {/* ADMIN DASHBOARD */}
      {isAdminView && adminStats && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide"> Organization Overview</h2>
          </div>
          
          {/* KPI Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                <Statistic title="Total Projects" value={adminStats.kpi.totalProjects} prefix={<ProjectOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                <Statistic title="Total Members" value={adminStats.kpi.totalMembers} prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                <Statistic title="Completed Projects" value={adminStats.kpi.completedProjects} prefix={<AntCheckCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                <div className="text-gray-500 mb-1 pb-5 text-sm">Avg Progress</div>
                <Progress percent={adminStats.kpi.avgProgress} status="active" strokeColor={{ from: '#ff4d4f', to: '#52c41a' }} />
              </Card>
            </Col>
          </Row>

          {/* Charts & List */}
          <Row gutter={[16, 16]} className='mb-6'>
            <Col xs={24} lg={14}>
              <Card title="Project Distribution" bordered={false} className="shadow-sm rounded-xl">
                <ReactECharts option={getAdminPieOption()} style={{ height: 250 }} />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Upcoming Deadlines " bordered={false} className="shadow-sm rounded-xl h-full">
                <List
                  itemLayout="horizontal"
                  dataSource={adminStats.lists.upcomingDeadlines}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<CalendarIcon className="w-5 h-5 text-red-500 mt-1" />}
                        title={<span className="font-medium text-gray-700">{item.name}</span>}
                        description={<span className="text-xs text-gray-500">{new Date(item.deadline).toLocaleDateString()}</span>}
                      />
                      <Tag color="#f35640">{item.status}</Tag>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          <div className="mb-2 mt-8 flex items-center gap-2 border-t border-gray-200 pt-6"></div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                Project Analytics
            </h2>

          <div className="flex items-center gap-3 mb-6">
                <div className='relative'>
                   <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select 
                    className="border border-gray-300 pl-9 px-4 py-2 rounded-lg appearance-none cursor-pointer bg-white text-sm min-w-[140px] shadow-sm hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    value={`${selectedMonth}-${selectedYear}`}
                    onChange={handleDateChange}
                >
                    {monthYearOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-brand)] text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                  Export report
                </button>
              </div>
              </div>

           <TaskSummary summaryData={stats ? formatTaskSummaryData(stats) : dynamicTasksSummary} />

          <Row gutter={[16, 16]} className='mb-6'>
            <Col xs={24} lg={16}>
              <Card title="Task Priority Distribution" bordered={false} className="shadow-sm rounded-xl">
                <ReactECharts option={getAdminBarOption()} style={{ height: 250 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Overall Progress" bordered={false} className="shadow-sm rounded-xl h-full flex flex-col items-center justify-center">
                <div className="text-center w-full flex flex-col items-center py-4">
                    <Progress 
                        type="dashboard" 
                        percent={adminStats.charts.progress.percent} 
                        strokeColor="#faad14"
                    />
                    <div className="mt-4 text-gray-500 font-medium">
                        {adminStats.charts.progress.done} / {adminStats.charts.progress.total} Tasks Done
                    </div>
                </div>
              </Card>
            </Col>
          </Row>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col"> 
              <h2 className="text-lg font-semibold mb-4">Project Status</h2>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Loading chart...</div>
              ) : (stats && stats.tasksByStatus && stats.tasksByStatus.length > 0) ? (
                <>
                  <div className="flex items-center justify-center h-48">
                    <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
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

            {/* Recent Activity List */}
              <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col h-full" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '320px' }}>
                  {activities.length > 0 ? (
                    activities.slice(0, 15).map((act) => (
                      <div key={act._id} className="flex gap-3 group items-start transition-colors hover:bg-gray-50/50 p-1.5 rounded-lg -mx-1.5">
                        <div className="flex-shrink-0 mt-0.5">
                            {act.userId?.avatar ? (
                                <img src={act.userId.avatar} alt={act.userId.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold " style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)', color: 'var(--color-brand, #3b82f6)' }}>
                                    {act.userId?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 leading-snug break-words">
                                {formatActivityContent(act)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                                <ClockSolid className="w-3 h-3 text-gray-300" />
                                {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <TotalSolid className="w-8 h-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No activity recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </section>
      )}

      {/* MANAGER DASHBOARD */}
      {isManagerView && managerStats && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100 ">
          <div className="mb-2 flex items-center gap-2  border-gray-200 pt-6 justify-between">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide"> Management Overview</h2>
            <div className="flex items-center gap-3 mb-6">
                <div className='relative'>
                   <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select 
                    className="border border-gray-300 pl-9 px-4 py-2 rounded-lg appearance-none cursor-pointer bg-white text-sm min-w-[140px] shadow-sm hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    value={`${selectedMonth}-${selectedYear}`}
                    onChange={handleDateChange}
                >
                    {monthYearOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-brand)] text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                  Export report
                </button>
              </div>
              </div>
          

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                 <Statistic title="My Projects" value={managerStats.kpi.myProjects} /> 
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                <Statistic title="Team Size" value={managerStats.kpi.teamSize} prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                <Statistic title="Tasks Completed" value={managerStats.kpi.tasksCompleted} prefix={<AntCheckCircleOutlined />} />
              </Card>
            </Col>
          </Row>

          <TaskSummary summaryData={managerSummaryData}></TaskSummary>

          <Row gutter={[16, 16]} className='mb-6'>
            <Col xs={24} lg={16}>
              <Card title="Task Priority Distribution" bordered={false} className="shadow-sm rounded-xl">
                <ReactECharts option={getManagerBarOption()} style={{ height: 250 }} />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Overall Progress" bordered={false} className="shadow-sm rounded-xl h-full flex flex-col items-center justify-center">
                <div className="text-center w-full flex flex-col items-center py-4">
                    <Progress 
                        type="dashboard" 
                        percent={managerStats.charts.progress.percent} 
                        strokeColor="#faad14"
                    />
                    <div className="mt-4 text-gray-500 font-medium">
                        {managerStats.charts.progress.done} / {managerStats.charts.progress.total} Tasks Done
                    </div>
                </div>
              </Card>
            </Col>
          </Row>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Project Status</h2>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">Loading chart...</div>
              ) : (stats && stats.tasksByStatus && stats.tasksByStatus.length > 0) ? (
                <>
                  <div className="flex items-center justify-center h-48">
                    <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
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

            {/* Recent Activity List */}
              <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col h-full" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '320px' }}>
                  {activities.length > 0 ? (
                    activities.slice(0, 15).map((act) => (
                      <div key={act._id} className="flex gap-3 group items-start transition-colors hover:bg-gray-50/50 p-1.5 rounded-lg -mx-1.5">
                        <div className="flex-shrink-0 mt-0.5">
                            {act.userId?.avatar ? (
                                <img src={act.userId.avatar} alt={act.userId.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold " style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)', color: 'var(--color-brand, #3b82f6)' }}>
                                    {act.userId?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 leading-snug break-words">
                                {formatActivityContent(act)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                                <ClockSolid className="w-3 h-3 text-gray-300" />
                                {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <TotalSolid className="w-8 h-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No activity recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </section>
      )}

      {/* MEMBER AREA */}
      {isMemberView && memberStats && (
      <section className='relative'>
      <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
        <TaskSummary summaryData={memberSummaryData} />
      </section>
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
          <div className="mb-4 mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
             <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide"> Project Analytics</h2>
             
             {/* Filter + Export  */}
             <div className="flex items-center gap-3">
                <div className='relative'>
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <select 
                    className="border border-gray-300 pl-9 px-4 py-2 rounded-lg appearance-none cursor-pointer bg-white text-sm min-w-[140px] shadow-sm hover:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    value={`${selectedMonth}-${selectedYear}`}
                    onChange={handleDateChange}
                >
                    {monthYearOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-brand)] text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity">
                  Export report
                </button>
              </div>
          </div>

          {/*  MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/*  PROGRESS STATUS (USER DATA) */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Progress Status</h2>
              {/* Sử dụng !memberStats để check loading thay vì biến 'loading' chung */}
              {!memberStats ? (<div className="flex-1 flex items-center justify-center text-gray-400">Loading chart...</div>) : (
                <>
                  <div className="flex items-center justify-center h-48"><ReactECharts option={getMemberPieOption()} style={{ height: '100%', width: '100%' }} /></div>
                  <ul className="mt-5 space-y-2 text-gray-600">
                    {[
                      { id: 'todo', label: 'Todo', value: memberStats.kpi?.todoTasks, color: 'bg-orange-400' },
                      { id: 'doing', label: 'In Progress', value: memberStats.kpi?.doingTasks, color: 'bg-blue-500' },
                      { id: 'done', label: 'Completed', value: memberStats.kpi?.doneTasks, color: 'bg-green-500' }
                    ].map((item) => {
                      const total = memberStats.kpi?.totalTasks || 0;
                      const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <li key={item.id} className="flex justify-between text-sm">
                          <span className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${item.color}`}></span>{item.label}</span>
                          <span>{item.value || 0} ({percent}%)</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {/*  TASK PRIORITY (USER DATA) */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col">
              <h2 className="text-lg font-semibold mb-4">Task Priority Distribution</h2>             
                <ReactECharts option={getMemberBarOption()} style={{ height: 250 }} />          
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Activity Chart */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Weekly Activity</h2>
                </div>
                
                    <div className="flex-1">
                      <ReactECharts option={getWeeklyActivityOption()} style={{ height: 250, width: '100%' }} />
                    </div>
                
            </div>

          {/* Recent Activity List */}
              <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col h-full" style={{ minHeight: '400px' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '320px' }}>
                  {activities.length > 0 ? (
                    activities.slice(0, 15).map((act) => (
                      <div key={act._id} className="flex gap-3 group items-start transition-colors hover:bg-gray-50/50 p-1.5 rounded-lg -mx-1.5">
                        <div className="flex-shrink-0 mt-0.5">
                            {act.userId?.avatar ? (
                                <img src={act.userId.avatar} alt={act.userId.name} className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm" />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold " style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)', color: 'var(--color-brand, #3b82f6)' }}>
                                    {act.userId?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-600 leading-snug break-words">
                                {formatActivityContent(act)}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                                <ClockSolid className="w-3 h-3 text-gray-300" />
                                {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
                        <TotalSolid className="w-8 h-8 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No activity recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </section>
      </section>
      )}

      {/* AI Widget  */}
      {showAIBrief && (
        <AIDailyWidget onClose={() => setShowAIBrief(false)} />
      )}

      {/* Floating Action Button  */}
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

export default HomePage