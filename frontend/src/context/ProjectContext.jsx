import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    // Mặc định là 'all' (Xem tất cả) hoặc lấy từ localStorage nếu F5 lại trang
    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        return localStorage.getItem('currentProjectId') || 'all';
    });

    const [selectedProjectName, setSelectedProjectName] = useState('All Projects');

    // Hàm đổi dự án (Gọi từ Sidebar)
    const switchProject = (projectId, projectName) => {
        setSelectedProjectId(projectId);
        setSelectedProjectName(projectName);
        localStorage.setItem('currentProjectId', projectId);
    };

    return (
        <ProjectContext.Provider value={{ selectedProjectId, selectedProjectName, switchProject }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => useContext(ProjectContext);