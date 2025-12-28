import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:4000/api';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
});

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        return localStorage.getItem('currentProjectId') || 'all';
    });

    const [selectedProjectName, setSelectedProjectName] = useState(() => {
        return localStorage.getItem('currentProjectName') || 'All Projects';
    });

    const [project, setProject] = useState(null);
    const [isLoadingProject, setIsLoadingProject] = useState(false);
    const [projectError, setProjectError] = useState(null);

    const fetchProjectDetails = useCallback(async (projectId) => {
        // Reset state khi chọn 'all'
        if (!projectId || projectId === 'all') {
            setProject(null);
            setProjectError(null);
            return;
        }

        setIsLoadingProject(true);
        setProjectError(null);
        
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
                headers: getHeaders()
            });
            
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch project');
            }

            const data = await res.json();
            
            console.log('🔍 [ProjectContext] API Response:', {
                projectId,
                success: data.success,
                currentUserRole: data.data?.currentUserRole,
                projectName: data.data?.name
            });
            
            if (data.success && data.data) {
                const projectData = {
                    ...data.data,
                    // Đảm bảo currentUserRole luôn có giá trị
                    currentUserRole: data.data.currentUserRole || 'Member'
                };
                
                console.log('[ProjectContext] Setting project:', {
                    id: projectData._id,
                    name: projectData.name,
                    currentUserRole: projectData.currentUserRole
                });
                
                setProject(projectData);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('[ProjectContext] Fetch error:', error);
            setProjectError(error.message);
            setProject(null);
        } finally {
            setIsLoadingProject(false);
        }
    }, []);

    const switchProject = useCallback(async (projectId, projectName) => {
        console.log('[ProjectContext] Switching project:', { projectId, projectName });
        
        // Update state ngay lập tức
        setSelectedProjectId(projectId);
        setSelectedProjectName(projectName || 'Unknown Project');
        
        // Persist to localStorage
        localStorage.setItem('currentProjectId', projectId);
        localStorage.setItem('currentProjectName', projectName || 'Unknown Project');

        // Fetch project details (bao gồm currentUserRole)
        await fetchProjectDetails(projectId);
    }, [fetchProjectDetails]);

    // Initial fetch khi component mount
    useEffect(() => {
        const storedProjectId = localStorage.getItem('currentProjectId');
        if (storedProjectId && storedProjectId !== 'all') {
            console.log('[ProjectContext] Initial fetch for stored project:', storedProjectId);
            fetchProjectDetails(storedProjectId);
        }
    }, [fetchProjectDetails]);

    const refreshProject = useCallback(() => {
        if (selectedProjectId && selectedProjectId !== 'all') {
            console.log('[ProjectContext] Refreshing project:', selectedProjectId);
            fetchProjectDetails(selectedProjectId);
        }
    }, [selectedProjectId, fetchProjectDetails]);

    // Debug log khi state thay đổi
    useEffect(() => {
        console.log('[ProjectContext] State updated:', {
            selectedProjectId,
            selectedProjectName,
            currentUserRole: project?.currentUserRole || 'N/A',
            isLoading: isLoadingProject
        });
    }, [project, selectedProjectId, selectedProjectName, isLoadingProject]);

    const value = {
        selectedProjectId, 
        selectedProjectName, 
        project,
        isLoadingProject,
        projectError,
        switchProject,
        refreshProject,
        // Helper getter cho role
        currentProjectRole: project?.currentUserRole || null
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};