import React, { useState, useEffect, useCallback } from 'react';
import { 
    PlusIcon, 
    UserPlusIcon,
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

const PRIMARY_COLOR = '#f35640'; 
const API_BASE_URL = 'http://localhost:4000/api';

// --- Sub-component: Notification Banner ---
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;

    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
    const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;

    return (
        <div className={`fixed top-20 right-5 z-50 flex items-center p-4 mb-4 rounded-lg shadow-lg border ${bgColor} ${textColor} ${borderColor} animate-fade-in-down`}>
            <Icon className="w-5 h-5 mr-3" />
            <div className="text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- Helper Functions ---
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
});

const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// --- Sub-components ---
const StatusBadge = ({ status }) => {
    let colors = '';
    switch (status) {
        case 'Completed': colors = 'bg-green-100 text-green-700'; break;
        case 'Archived': colors = 'bg-gray-100 text-gray-600'; break;
        default: colors = 'bg-blue-100 text-blue-700'; 
    }
    return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors}`}>{status || 'In Progress'}</span>;
};

const ProgressBar = ({ progress }) => (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
    </div>
);

const ProjectCard = ({ project }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer">
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
                    <span>{project.memberCount} members</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{project.deadline ? formatDate(project.deadline) : 'No deadline'}</span>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
const Projects = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [projects, setProjects] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); 
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    // State thông báo
    const [notification, setNotification] = useState({ message: '', type: '' });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const fetchProjects = useCallback(async () => {
        setIsLoading(true);
        setIsError(false);
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                headers: getHeaders()
            });

            if (!response.ok) throw new Error("Failed to fetch projects");

            const result = await response.json();
            const rawProjects = result.data || [];

            const mappedProjects = rawProjects.map(p => ({
                id: p._id,
                name: p.name,
                description: p.description,
                status: 'In Progress', 
                progress: Math.floor(Math.random() * 100), 
                memberCount: p.members ? p.members.length : 1, 
                deadline: p.deadline,
                createdAt: p.createdAt
            }));

            setProjects(mappedProjects);
        } catch (error) {
            console.error(error);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Xử lý tạo dự án 
    const handleAddProject = async (newProjectData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    name: newProjectData.name,
                    description: newProjectData.description,
                    // GỬI DỮ LIỆU LÊN SERVER
                    deadline: newProjectData.deadline, 
                    manager: newProjectData.manager 
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to create project");
            }

            showNotification("Project created successfully!", "success");
            fetchProjects(); 
            setIsNewProjectModalOpen(false);

        } catch (error) {
            showNotification(error.message, "error");
        }
    };

    const renderContent = () => {
        if (isLoading) return <div className="h-64"><LoaderOverlay /></div>;
        if (isError) return <ErrorState message="Failed to load projects." onRetry={fetchProjects} />;
        if (projects.length === 0) return <EmptyState title="No Projects Found" message="Get started by creating a new project." />;
        
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            );
        }
        
        if (viewMode === 'list') {
            return (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projects.map(project => (
                                <tr key={project.id} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                                    </td>
                                    <td className="px-6 py-4"><StatusBadge status={project.status} /></td>
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center">
                                            <div className="w-full mr-3"><ProgressBar progress={project.progress} /></div>
                                            <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{project.memberCount} members</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(project.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
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
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                            <UserPlusIcon className="w-5 h-5" /> Invite
                        </button>
                        <button 
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: PRIMARY_COLOR }}
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
        </div>
    );
};

export default Projects;