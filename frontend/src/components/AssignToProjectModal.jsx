import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserPlusIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../utils/constants';

// Thêm prop 'user' để biết đang assign ai
const AssignToProjectModal = ({ isOpen, onClose, onAssignSuccess, user }) => {
    const [projects, setProjects] = useState([]);
    
    // Form State (Chỉ cần chọn Project và Role)
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedRole, setSelectedRole] = useState('Member'); 

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
    });

    // Fetch danh sách Project khi mở Modal
    useEffect(() => {
        if (isOpen) {
            setErrors({});
            setSelectedProject('');
            setSelectedRole('Member');
            
            const fetchProjects = async () => {
                setIsLoading(true);
                try {
                    const res = await fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() });
                    const data = await res.json();
                    if (data.success) {
                        setProjects(data.data || []);
                    }
                } catch (error) {
                    console.error(error);
                    setErrors({ form: "Failed to load projects." });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProjects();
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!selectedProject) newErrors.project = "Please select a project.";
        // Kiểm tra user có tồn tại không (phòng trường hợp lỗi logic)
        if (!user || (!user.id && !user._id)) newErrors.form = "No user selected to assign.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const userId = user.id || user._id; // Lấy ID của user đang chọn

            // API: Thêm user vào project
            const response = await fetch(`${API_BASE_URL}/projects/${selectedProject}/members`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ 
                    userId: userId, 
                    role: selectedRole 
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({ form: data.message || "Failed to assign member." });
                return;
            }

            if (onAssignSuccess) onAssignSuccess();
            onClose();
        } catch (error) {
            setErrors({ form: "Server connection error." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const getInputClass = (field) => `w-full px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-[var(--color-brand)] bg-white text-gray-900 ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <UserPlusIcon className="w-6 h-6 text-[var(--color-brand)]" />
                        Assign to Project
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {errors.form && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200 text-center font-medium">
                        {errors.form}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Hiển thị thông tin người đang được Assign (Không cho sửa) */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Assigning Member</span>
                            <div className="font-bold text-gray-900 text-lg mt-0.5">
                                {user?.name || "Unknown User"} 
                            </div>
                            <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg border-2 border-white shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-4 text-center text-gray-500">Loading projects...</div>
                    ) : (
                        <>
                            {/* Select Project */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Project</label>
                                <div className="relative">
                                    <BriefcaseIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                                    <select 
                                        className={`${getInputClass('project')} pl-10`}
                                        value={selectedProject} 
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                    >
                                        <option value="">-- Select a project --</option>
                                        {projects.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {errors.project && <p className="text-red-500 text-xs mt-1 font-medium">{errors.project}</p>}
                            </div>

                            {/* Select Role */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Assign Role</label>
                                <select 
                                    className={getInputClass('role')}
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>
                        </>
                    )}

                    {/* Footer Buttons */}
                    <div className="pt-4 flex justify-end space-x-3 mt-2">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSubmitting || isLoading} 
                            className="px-6 py-2.5 text-sm font-bold text-white rounded-lg hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: 'var(--color-brand)' }}
                        >
                            {isSubmitting ? 'Assigning...' : 'Confirm Assign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignToProjectModal;