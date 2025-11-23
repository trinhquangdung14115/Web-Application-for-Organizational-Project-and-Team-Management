import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = '#f35640'; 
const API_BASE_URL = 'http://localhost:4000/api';

const AssignToProjectModal = ({ isOpen, onClose, onAssignSuccess }) => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State lỗi UI
    const [errors, setErrors] = useState({});

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
    });

    useEffect(() => {
        if (isOpen) {
            setErrors({});
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const [usersRes, projectsRes] = await Promise.all([
                        fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }),
                        fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() })
                    ]);
                    const usersData = await usersRes.json();
                    const projectsData = await projectsRes.json();
                    setUsers(usersData.data || []);
                    setProjects(projectsData.data || []);
                } catch (error) {
                    setErrors({ form: "Failed to load data." });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!selectedUser) newErrors.user = "Please select a member.";
        if (!selectedProject) newErrors.project = "Please select a project.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/projects/${selectedProject}/members`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ userId: selectedUser, role: 'Member' })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ form: data.message || "Assignment failed." });
                return;
            }

            if (onAssignSuccess) onAssignSuccess();
            
            setSelectedUser('');
            setSelectedProject('');
            onClose();
        } catch (error) {
            setErrors({ form: "Server connection error." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInputClass = (field) => `w-full px-3 py-2 border rounded-lg ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Assign Member</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                {errors.form && <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-200 text-center">{errors.form}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isLoading ? (
                        <p className="text-center text-gray-500 py-4">Loading data...</p>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Member</label>
                                <select className={getInputClass('user')} value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                                    <option value="">Select a member...</option>
                                    {users.map(u => (<option key={u._id} value={u._id}>{u.name} ({u.email})</option>))}
                                </select>
                                {errors.user && <p className="text-red-500 text-xs mt-1">{errors.user}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                                <select className={getInputClass('project')} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                                    <option value="">Select a project...</option>
                                    {projects.map(p => (<option key={p._id} value={p._id}>{p.name}</option>))}
                                </select>
                                {errors.project && <p className="text-red-500 text-xs mt-1">{errors.project}</p>}
                            </div>
                        </>
                    )}

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting || isLoading} className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {isSubmitting ? 'Assigning...' : 'Assign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignToProjectModal;