import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = '#f35640'; 
const API_BASE_URL = 'http://localhost:4000/api';

const NewProjectModal = ({ isOpen, onClose, onAddProject }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [manager, setManager] = useState('');
    const [managersList, setManagersList] = useState([]);
    
    // State lưu lỗi
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            // Reset form và lỗi khi mở lại
            setName(''); 
            setDescription(''); 
            setDeadline(''); 
            setManager(''); 
            setErrors({});
            
            const fetchUsers = async () => {
                try {
                    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
                    const res = await fetch(`${API_BASE_URL}/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.success) setManagersList(data.data || []);
                } catch (err) { console.error(err); }
            };
            fetchUsers();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newErrors = {};
        // Validate BẮT BUỘC cả Name, Manager, và Deadline
        if (!name.trim()) newErrors.name = "Project Name is required.";
        if (!manager) newErrors.manager = "Please select a Manager.";
        if (!deadline) newErrors.deadline = "Deadline is required.";
        
        // Nếu có lỗi -> dừng lại và hiện lỗi
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        // Nếu OK -> Gửi dữ liệu đi
        onAddProject({ name, description, deadline, manager });
    };

    const getInputClass = (field) => `w-full px-3 py-2 border rounded-lg ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                        <input type="text" className={getInputClass('name')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                        {/* Description là tùy chọn, không cần dấu * */}
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manager <span className="text-red-500">*</span></label>
                            <select className={getInputClass('manager')} value={manager} onChange={(e) => setManager(e.target.value)}>
                                <option value="">Select Manager...</option>
                                {managersList.map(m => (<option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>))}
                            </select>
                            {errors.manager && <p className="text-red-500 text-xs mt-1">{errors.manager}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
                            <input type="date" className={getInputClass('deadline')} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}>Create</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;