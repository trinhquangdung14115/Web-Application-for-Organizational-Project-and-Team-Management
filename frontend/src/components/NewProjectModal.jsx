import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:4000/api';

const NewProjectModal = ({ isOpen, onClose, onAddProject }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');
    const [manager, setManager] = useState('');
    const [managersList, setManagersList] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    //(chống click đúp)
    const isSubmittingRef = useRef(false);

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
            setIsSubmitting(false);
            isSubmittingRef.current = false;
            
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

    const handleSubmit = async () => {
        
        // Chặn nếu đang gửi
        if (isSubmittingRef.current) return;

        const newErrors = {};
        
        // Validate các trường bắt buộc
        if (!name.trim()) newErrors.name = "Project Name is required.";
        if (!deadline) newErrors.deadline = "Deadline is required.";

        if (deadline) {
            const selectedDate = new Date(deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const year = selectedDate.getFullYear();

            if (
                isNaN(selectedDate.getTime()) || 
                year < 2000 || 
                year > 3000 || 
                selectedDate < today
            ) {
                newErrors.deadline = "Invalid date (must be future).";
            }
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            
            const payload = { name, description, deadline };
            if (manager) payload.manager = manager;

            await onAddProject(payload); 
            

            
        } catch (error) {
            console.error("Error creating project:", error);
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }

    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            handleSubmit();
        }
    };

    const getInputClass = (field) => `w-full px-3 py-2 border rounded-lg ${errors[field] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                {/*  Thay thẻ <form> bằng <div> để chặn trình duyệt tự submit */}
                <div className="space-y-4" onKeyDown={handleKeyDown}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                        <input type="text" className={getInputClass('name')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter project name" autoFocus />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter description" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            {/* Manager Optional */}
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manager (Optional)</label>
                            <select className={getInputClass('manager')} value={manager} onChange={(e) => setManager(e.target.value)}>
                                <option value="">-- Assign Later --</option>
                                {managersList.map(m => (<option key={m._id || m.id} value={m._id || m.id}>{m.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline <span className="text-red-500">*</span></label>
                            <input type="date" className={getInputClass('deadline')} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                            {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2 text-sm border rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        
                        {/*  Đổi type="submit" thành "button" và gọi onClick thủ công */}
                        <button 
                            type="button" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 shadow-md disabled:opacity-50 disabled:cursor-not-allowed" 
                            style={{ backgroundColor: 'var(--color-brand)' }}
                        >
                            {isSubmitting ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewProjectModal;