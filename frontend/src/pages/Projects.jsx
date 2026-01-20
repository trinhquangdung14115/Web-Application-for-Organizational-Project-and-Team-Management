import React, { useState, useEffect, useCallback } from 'react';
import { 
    PlusIcon, 
    UsersIcon, 
    CalendarDaysIcon,
    ListBulletIcon,
    Squares2X2Icon,
    CheckCircleIcon,        
    ExclamationCircleIcon,  
    XMarkIcon
} from '@heroicons/react/24/outline';
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import NewProjectModal from '../components/NewProjectModal'; 
import ProjectDetailDrawer from '../components/ProjectDetailDrawer';

import { API_BASE_URL } from '../utils/constants';

// --- Sub-components (Định nghĩa ngay trong file để tránh lỗi import) ---

const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    return (
        <div className={`fixed top-20 right-5 z-[9999] flex items-center p-4 mb-4 rounded-lg shadow-lg border ${bgColor} ${textColor} border-opacity-50 animate-fade-in-down`}>
            {type === 'success' ? <CheckCircleIcon className="w-5 h-5 mr-3" /> : <ExclamationCircleIcon className="w-5 h-5 mr-3" />}
            <div className="text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1"><XMarkIcon className="w-4 h-4" /></button>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    let colors = 'bg-blue-100 text-blue-700';
    if (status === 'Completed') colors = 'bg-green-100 text-green-700';
    if (status === 'Archived') colors = 'bg-gray-100 text-gray-600';
    return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors}`}>{status || 'In Progress'}</span>;
};

const ProgressBar = ({ progress = 0 }) => (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="h-1.5 rounded-full" style={{ width: `${progress}%`, backgroundColor: progress < 50 ? '#f97316' : '#22c55e' }}></div>
    </div>
);

// --- Component Card ---
const ProjectCard = ({ project, onClick }) => {
    return (
        <div 
            onClick={() => onClick && onClick(project)}
            className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 flex flex-col justify-between hover:shadow-xl transition-all cursor-pointer transform hover:-translate-y-1 duration-200"
        >
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold text-gray-900 truncate" title={project.name}>{project.name}</h3>
                    <StatusBadge status={project.status} />
                </div>
                <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden line-clamp-2">
                    {project.description || "No description provided."}
                </p>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Progress</span>
                    <span className="text-xs font-semibold text-gray-800">{project.progress}%</span>
                </div>
                <ProgressBar progress={project.progress} />
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                    <UsersIcon className="w-4 h-4" />
                    <span>{project.memberCount || 0} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</span>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---
const Projects = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [projects, setProjects] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); 
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });

    // Lấy token an toàn
    const getHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    };

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() });
            
            if (!response.ok) throw new Error("Failed to fetch projects");

            const result = await response.json();
            const rawProjects = result.data || [];
            
            // Map dữ liệu an toàn
            const mappedProjects = rawProjects.map(p => ({
                id: p._id || p.id,
                name: p.name || 'Unnamed Project',
                description: p.description,
                status: p.status || 'In Progress', 
                progress: p.progress ?? 0, 
                memberCount: p.memberCount ?? 0,
                deadline: p.deadline,
                createdAt: p.createdAt
            }));

            setProjects(mappedProjects);
        } catch (error) {
            console.error("Fetch Projects Error:", error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Xử lý tạo dự án mới
    const handleAddProject = async (newProjectData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(newProjectData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Failed");

            setNotification({ message: "Project created!", type: "success" });
            fetchProjects(); 
            setIsNewProjectModalOpen(false);
        } catch (error) {
            setNotification({ message: error.message, type: "error" });
        }
    };

    // Hàm render nội dung chính
    const renderContent = () => {
        if (isLoading) return <div className="h-64 flex items-center justify-center"><LoaderOverlay /></div>;
        
        if (isError) return <ErrorState message="Failed to load projects." onRetry={fetchProjects} />;
        
        if (!projects || projects.length === 0) {
            return <EmptyState title="No Projects Found" message="Get started by creating a new project." />;
        }
        
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                            onClick={setSelectedProject} // Truyền hàm set state trực tiếp
                        />
                    ))}
                </div>
            );
        }
        
        // List View
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map(project => (
                            <tr key={project.id} onClick={() => setSelectedProject(project)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                    <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                                </td>
                                <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                                <td className="px-6 py-4 w-48"><ProgressBar progress={project.progress} /></td>
                                <td className="px-6 py-4 text-sm text-gray-600">{project.memberCount} members</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen relative">
            {/* Hiển thị Notification Banner */}
            <NotificationBanner 
                message={notification.message} 
                type={notification.type} 
                onClose={() => setNotification({ message: '', type: '' })} 
            />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-700">Projects List</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: 'var(--color-brand)' }}
                            onClick={() => setIsNewProjectModalOpen(true)}
                        >
                            <PlusIcon className="w-5 h-5" /> New Project
                        </button>
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                        <button className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`} onClick={() => setViewMode('grid')}>
                            <Squares2X2Icon className={`w-5 h-5 ${viewMode === 'grid' ? 'text-gray-800' : 'text-gray-600'}`} />
                        </button>
                        <button className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`} onClick={() => setViewMode('list')}>
                            <ListBulletIcon className={`w-5 h-5 ${viewMode === 'list' ? 'text-gray-800' : 'text-gray-600'}`} />
                        </button>
                    </div>
                </div>

                {renderContent()}
            </div>
            
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onAddProject={handleAddProject}
            />

            {/* Modal Detail Project */}
            <ProjectDetailDrawer 
                isOpen={!!selectedProject} 
                onClose={() => setSelectedProject(null)} 
                project={selectedProject} 
            />
        </div>
    );
};

export default Projects;