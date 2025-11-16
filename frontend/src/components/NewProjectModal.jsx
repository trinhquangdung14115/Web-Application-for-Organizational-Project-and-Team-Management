import React, { useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { mockMembers } from '../mocks/members'; 

const PRIMARY_COLOR = '#f35640'; 

// Lọc ra các manager/admin từ mock
const managers = mockMembers.filter(m => m.role === 'Admin' || m.role === 'Manager');

const NewProjectModal = ({ isOpen, onClose, onAddProject }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [manager, setManager] = useState(managers.length > 0 ? managers[0].id : '');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !deadline) {
            alert("Name and Deadline are required.");
            return;
        }
        
        const managerName = managers.find(m => m.id === manager)?.name || 'N/A';
        
        // Gửi dữ liệu lên component cha
        onAddProject({
            name,
            description,
            deadline,
            manager: managerName,
        });
        
        onClose(); // Đóng modal
    };

    return (
        // Lớp nền mờ (Backdrop)
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            {/* Panel Modal */}
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 relative transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
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
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="name"
                            placeholder="Enter project name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            rows={3}
                            placeholder="Enter a brief description..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
                                Manager
                            </label>
                            <select 
                                id="manager"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                                value={manager}
                                onChange={(e) => setManager(e.target.value)}
                            >
                                {managers.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                                Deadline <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="date"
                                id="deadline"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                        </div>
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
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;