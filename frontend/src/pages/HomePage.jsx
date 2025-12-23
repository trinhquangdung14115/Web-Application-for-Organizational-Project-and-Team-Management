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
  // 🔵 THÊM MỚI: Import Ant Design Components cho Dashboard Block mới
import { Card, Row, Col, Statistic, Progress, List, Tag, Spin } from "antd";
import { 
  ProjectOutlined, TeamOutlined, CheckCircleOutlined as AntCheckCircleOutlined 
} from "@ant-design/icons";
// 🔵 THÊM MỚI: Import Service Dashboard (đã tạo ở bước trước)
import dashboardService from "../services/dashboardService";

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
  // 🔵 THÊM MỚI: State cho User Role và Dashboard Data mới
  const [user, setUser] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  const [managerStats, setManagerStats] = useState(null);
  const [memberStats, setMemberStats] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);



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

  // 🔵 THÊM MỚI: Lấy User từ LocalStorage để phân quyền
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
     const parsedUser = JSON.parse(storedUser);
      console.log(">>> CURRENT USER:", parsedUser); // 🔵 Debug: Xem Role là gì
      setUser(parsedUser);
    }
  }, []);

  // 🔵 THÊM MỚI: Fetch dữ liệu Admin/Manager Stats
  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      try {
        const promises = [];
        // Block 1: Admin Stats
        if (user.role === 'Admin') {
          promises.push(dashboardService.getAdminStats().then(data => ({ type: 'ADMIN', data })));
        }
        // Block 2: Manager Stats (Admin hoặc Manager đều lấy)
        if (user.role === 'Manager'){
        promises.push(dashboardService.getManagerStats().then(data => ({ type: 'MANAGER', data })));
        }
        if (user.role === 'Member'){
            promises.push(dashboardService.getMemberStats().then(data => ({ type: 'MEMBER', data })));
        }
        

        const results = await Promise.allSettled(promises);
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            const { type, data } = result.value;
            if (type === 'ADMIN') setAdminStats(data);
            if (type === 'MANAGER') setManagerStats(data);
            if (type === 'MEMBER') setMemberStats(data);
          }
        });
      } catch (error) {
        console.error("Dashboard Service Error:", error);
      } finally {
        setDashboardLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
// 🔵 THÊM MỚI: Helpers cho biểu đồ mới (Admin/Manager)
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
    xAxis: { type: 'value', boundaryGap: [0, 0.01] },
    yAxis: { type: 'category', data: adminStats?.charts?.priorityDistribution.map(i => i.name) || [] },
    series: [{
        name: 'Tasks', type: 'bar',
        data: adminStats?.charts?.priorityDistribution.map(i => i.value) || [],
        itemStyle: { color: '#f35640', borderRadius: [0, 4, 4, 0] }
    }]
  });

  const getManagerBarOption = () => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', boundaryGap: [0, 0.01] },
    yAxis: { type: 'category', data: managerStats?.charts?.priorityDistribution.map(i => i.name) || [] },
    series: [{
        name: 'Tasks', type: 'bar',
        data: managerStats?.charts?.priorityDistribution.map(i => i.value) || [],
        itemStyle: { color: '#f35640', borderRadius: [0, 4, 4, 0] }
    }]
  });

  // 🔵 MEMBER PIE CHART OPTION (Dùng dữ liệu memberStats)
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

  // 🔵 CONFIG BIỂU ĐỒ CỘT (WEEKLY ACTIVITY)
  const getWeeklyActivityOption = () => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: memberStats?.charts?.last7DaysActivity.map(d => d.day) || [], 
        axisTick: { show: false }, 
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280' } 
      },
      yAxis: { 
        type: 'value',
        minInterval: 1, 
        splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
        axisLabel: { color: '#6b7280' } 
      },
      series: [{ 
        name: 'Tasks Done', 
        type: 'bar', 
        barWidth: '40%', 
        data: memberStats?.charts?.last7DaysActivity.map(d => d.value) || [], 
        itemStyle: { color: '#f35640', borderRadius: [4, 4, 0, 0] },
        showBackground: true,
        backgroundStyle: { color: '#f9fafb', borderRadius: [4, 4, 0, 0] }
      }]
    };
  };

  // --- LOGIC PHÂN QUYỀN HIỂN THỊ ---
  const isAdmin = user?.role === 'Admin';
  const isManager = user?.role === 'Manager' || (managerStats?.kpi?.myProjects > 0); // Logic: Admin hoặc người có quản lý dự án
  const isMember = user?.role === 'Member';
  
  
  if (dashboardLoading) return <div className="flex h-screen items-center justify-center"><Spin size="large" /></div>;


  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      {/* ================================================================================== */}
      {/* 🔵 BLOCK 1: ADMIN DASHBOARD (Chỉ hiện cho ORG_ADMIN)                               */}
      {/* ================================================================================== */}
      {isAdmin && adminStats && (
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
                <Statistic title="Total Members" value={adminStats.kpi.totalMembers} prefix={<TeamOutlined />} valueStyle={{ color: '#3f8600' }} />
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
                    <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                      className="border border-gray-300 pl-9 px-2 py-2 rounded-lg appearance-none cursor-pointer bg-white"
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
                    <select className="border border-gray-300 rounded-lg px-7 py-2 text-gray-700 appearance-none cursor-pointer bg-white">
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
              </div>

           <TaskSummary summaryData={dynamicTasksSummary} />

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
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col"> {/*pie chart hiển thị task status cho member, AM và MN giuwx nguyên*/}
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

            {/* Recent Activity (Code Gốc) */}
          <div className="bg-white rounded-xl p-6 shadow border border-gray-100 ">
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
                        {' '}{act.content || act.action || "updated a task"} 
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
          </div>
          

        </section>
      )}

      {/* ================================================================================== */}
      {/* 🔵 BLOCK 2: MANAGER DASHBOARD (Hiện cho Manager)                           */}
      {/* ================================================================================== */}
      {isManager && managerStats && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-100 ">
           {/* Dùng Divider hoặc khoảng cách để phân tách */}
          
          <div className="mb-2 flex items-center gap-2  border-gray-200 pt-6 justify-between">
            <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide"> Management Overview</h2>
            <div className="flex items-center gap-3 mb-6">
                <div className='relative'>
                    <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                      className="border border-gray-300 pl-9 px-2 py-2 rounded-lg appearance-none cursor-pointer bg-white"
                      value={currentProjectId || ""}
                      onChange={(e) => setCurrentProjectId(e.target.value)}
                    >
                      {/* Thêm logic filter trước khi map */}
                      {projects
                        ?.filter(p => {
                            const currentUserId = user?._id || user?.uid; 
                            return p.ownerId === currentUserId || p.members?.includes(currentUserId);
                        })
                        .map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <div className='relative'>
                    <select className="border border-gray-300 rounded-lg px-7 py-2 text-gray-700 appearance-none cursor-pointer bg-white">
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
              </div>
          

          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={8}>
              <Card bordered={false} className="shadow-sm hover:shadow-md transition-all">
                 <Statistic title="My Projects" value={managerStats.kpi.myProjects} /> {/* // admin ẩn cái này đi */}
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

           <TaskSummary summaryData={dynamicTasksSummary} />

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
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col"> {/*pie chart hiển thị task status cho member, AM và MN giuwx nguyên*/}
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

            {/* Recent Activity (Code Gốc) */}
          <div className="bg-white rounded-xl p-6 shadow border border-gray-100 ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <button className="text-brand text-sm hover:underline">View all activity</button>
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
                        {' '}{act.content || act.action || "updated a task"} 
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
          </div>

        </section>
      )}

      {/* ================================================================================== */}
      {/* 🔵 BLOCK 3: MEMBER AREA */}
      {/* ================================================================================== */}
      {isMember && (
      <section className='relative'>
      <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-200">
        <TaskSummary summaryData={dynamicTasksSummary} />
      </section>
        <section className="animate-in fade-in slide-in-from-top-4 duration-700 delay-300">
          <div className="mb-4 mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
             <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide"> Project Analytics</h2>
             
             {/* Filter + Export (Code Gốc) */}
             <div className="flex items-center gap-3">
                <div className='relative'>
                    <FolderIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                      className="border border-gray-300 pl-9 px-2 py-2 rounded-lg appearance-none cursor-pointer bg-white"
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
                    <select className="border border-gray-300 rounded-lg px-7 py-2 text-gray-700 appearance-none cursor-pointer bg-white">
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
          </div>

          {/* --------- MAIN GRID (Code Gốc) --------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* 🔵 MODIFIED: PROGRESS STATUS (USER DATA) */}
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

            {/* 🔵 MODIFIED: TASK PRIORITY (USER DATA) */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Task Priority</h2>
              {!memberStats ? (
                 <div className="flex-1 flex items-center justify-center text-gray-400">Loading chart...</div>
              ) : (memberStats.priority) ? (
                 <div className="space-y-6 pt-2">
                    <Priority label="High" count={memberStats.priority.high || 0} total={memberStats.kpi?.totalTasks} color="bg-red-500" />
                    <Priority label="Medium" count={memberStats.priority.medium || 0} total={memberStats.kpi?.totalTasks} color="bg-orange-500" />
                    <Priority label="Low" count={memberStats.priority.low || 0} total={memberStats.kpi?.totalTasks} color="bg-green-500" />
                 </div>
              ) : (
                <div className="text-center text-gray-500 py-10">No priority data</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 3. 🔵 NEW: Weekly Activity Chart */}
            <div className="bg-white rounded-xl p-6 shadow border border-gray-100 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Weekly Activity</h2>
                </div>
                
                    <div className="flex-1">
                      <ReactECharts option={getWeeklyActivityOption()} style={{ height: '100%', width: '100%' }} />
                    </div>
                
            </div>

          {/* Recent Activity (Code Gốc) */}
          <div className="bg-white rounded-xl p-6 shadow border border-gray-100 ">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <button className="text-brand text-sm hover:underline">View all activity</button>
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
                        {' '}{act.content || act.action || "updated a task"} 
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
          </div>
        </section>
      </section>
      )}

      {/* 🔵 AI Widget (Giữ nguyên - Ai cũng có quyền dùng) */}
      {showAIBrief && (
        <AIDailyWidget onClose={() => setShowAIBrief(false)} />
      )}

      {/* Floating Action Button (Giữ nguyên) */}
      <button
        onClick={() => setShowAIBrief(!showAIBrief)}
        className="fixed bottom-6 left-6 z-50 p-5 bg-gradient-to-r from-[#3b064d] to-[#f35640] text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group ring-4 ring-white/50"
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

export default HomePage