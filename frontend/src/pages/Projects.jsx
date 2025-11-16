import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, 
    UserPlusIcon,
    UsersIcon, 
    CalendarDaysIcon,
    ListBulletIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { mockProjects } from '../mocks/projects';
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import NewProjectModal from '../components/NewProjectModal'; 

const PRIMARY_COLOR = '#f35640'; 

// --- Sub-components --- //
const StatusBadge = ({ status }) => {
    let colors = '';
    switch (status) {
        case 'In Progress': colors = 'bg-blue-100 text-blue-700'; break;
        case 'Completed': colors = 'bg-green-100 text-green-700'; break;
        case 'Archived': colors = 'bg-gray-100 text-gray-600'; break;
        default: colors = 'bg-yellow-100 text-yellow-700';
    }
    return <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colors}`}>{status}</span>;
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
                    <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                    <StatusBadge status={project.status} />
                </div>
                <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden">{project.description}</p>
            </div>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-500">Progress</span>
                    <span className="text-xs font-semibold text-gray-800">{project.progress}%</span>
                </div>
                <ProgressBar progress={project.progress} />
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1.5"><UsersIcon className="w-4 h-4" /><span>{project.memberCount} members</span></div>
                <div className="flex items-center gap-1.5"><CalendarDaysIcon className="w-4 h-4" /><span>{project.deadline}</span></div>
            </div>
        </div>
    );
};
const AvatarStack = () => {
    const avatars = [
        { initial: 'AH', color: 'bg-blue-200 text-blue-800' },
        { initial: 'EJ', color: 'bg-indigo-200 text-indigo-800' },
        { initial: 'BA', color: 'bg-purple-200 text-purple-800' },
    ];
    return (
        <div className="flex items-center">
            <div className="flex -space-x-2">
                {avatars.map(a => (
                    <div key={a.initial} className={`w-8 h-8 rounded-full ${a.color} flex items-center justify-center text-xs font-bold border-2 border-white`}>
                        {a.initial}
                    </div>
                ))}
            </div>
            <span className="ml-3 text-sm font-medium text-gray-600">4 members</span>
        </div>
    );
};


// === COMPONENT TRANG CHÍNH ===
const Projects = () => {

    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [projects, setProjects] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); 
    const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setProjects(mockProjects);
            setIsLoading(false);
        }, 1000); 
        return () => clearTimeout(timer);
    }, []);

    const handleAddProject = (newProjectData) => {
        console.log("Adding new project:", newProjectData);
        const date = new Date(newProjectData.deadline);
        const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000);
        const formattedDate = adjustedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const newProject = {
            id: `p${Date.now()}`,
            name: newProjectData.name,
            description: newProjectData.description,
            manager: newProjectData.manager,
            deadline: formattedDate,
            status: 'In Progress', 
            progress: 0,
            memberCount: 1,
        };
        setProjects(prevProjects => [newProject, ...prevProjects]);
    };

    const renderContent = () => {
        if (isLoading) return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoaderOverlay />
            </div>
        );
        if (isError) return <ErrorState message="Failed to load projects." />;
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
            // (Dạng Danh sách (List))
            return (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {projects.map(project => (
                                <tr key={project.id} className="hover:bg-gray-50 cursor-pointer">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                        <div className="text-sm text-gray-500 truncate max-w-xs">{project.description}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap w-48">
                                        <div className="flex items-center">
                                            <div className="w-full mr-3">
                                                <ProgressBar progress={project.progress} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{project.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {project.memberCount} members
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {project.deadline}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    };

    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                
                {/* (Header và Thanh Actions) */}
                {/* */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <AvatarStack />
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50">
                            <UserPlusIcon className="w-5 h-5" />
                            Invite
                        </button>
                        <button 
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                            onClick={() => setIsNewProjectModalOpen(true)}
                        >
                            <PlusIcon className="w-5 h-5" />
                            New Project
                        </button>
                    </div>
                </div>

                {/* (Toggles Grid/List) */}
                {/* */}
                <div className="flex justify-end mb-4">
                    <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg">
                        <button 
                            className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Squares2X2Icon className={`w-5 h-5 ${viewMode === 'grid' ? 'text-gray-800' : 'text-gray-600'}`} />
                        </button>
                        <button 
                            className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <ListBulletIcon className={`w-5 h-5 ${viewMode === 'list' ? 'text-gray-800' : 'text-gray-600'}`} />
                        </button>
                    </div>
                </div>

                {/* Nội dung chính (Grid hoặc List) */}
                {renderContent()}
            </div>
            
            {/* Modal */}
            {/* */}
            <NewProjectModal
                isOpen={isNewProjectModalOpen}
                onClose={() => setIsNewProjectModalOpen(false)}
                onAddProject={handleAddProject}
            />
        </div>
    );
};

export default Projects;