import React from 'react';
import { XMarkIcon, FolderPlusIcon } from '@heroicons/react/24/outline';
import { mockMembers } from '../mocks/members';
import { mockProjects } from '../mocks/projects';

const PRIMARY_COLOR = '#f35640'; 

const AssignToProjectModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted (UI-only)");
        onClose(); // Đóng modal sau khi submit
    };

    return (
        // Lớp nền mờ (Backdrop)
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            {/* Panel Modal */}
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()} // Ngăn click bên trong modal đóng modal
            >
                {/* Header: Title + Nút đóng */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Assign Member to Project</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="member" className="block text-sm font-medium text-gray-700 mb-1">
                            Member <span className="text-red-500">*</span>
                        </label>
                        <select 
                            id="member"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                        >
                            <option value="">Select a member...</option>
                            {/* Dùng mock data */}
                            {mockMembers.map(member => (
                                <option key={member.id} value={member.id}>{member.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                            Project <span className="text-red-500">*</span>
                        </label>
                        <select 
                            id="project"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                        >
                            <option value="">Select a project...</option>
                            {/* Dùng mock data */}
                            {mockProjects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Nút bấm */}
                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            Assign Member
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignToProjectModal;