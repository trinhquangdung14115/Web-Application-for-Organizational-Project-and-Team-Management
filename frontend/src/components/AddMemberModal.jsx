import React, { useState } from 'react'; 
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = '#f35640'; 

const AddMemberModal = ({ isOpen, onClose, onAddMember }) => {
    // === STATE CHO FORM ===
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Member');
    const [status, setStatus] = useState('Active');
    
    if (!isOpen) return null;

    // === HÀM SUBMIT (ĐỂ GỬI DATA LÊN) ===
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !email) {
            alert('Name and Email are required.');
            return;
        }
        
        // Gửi dữ liệu mới lên component cha 
        onAddMember({
            name,
            email,
            role,
            status,
        });
        
        // Reset form và đóng modal
        setName('');
        setEmail('');
        setRole('Member');
        onClose();
    };

    return (
        // (Lớp nền mờ )
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
            onClick={onClose}
        >
            {/* (Panel Modal) */}
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative transform transition-all duration-300"
                onClick={(e) => e.stopPropagation()} 
            >
                {/* (Header) */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Add Team Member</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* ===  FORM (ĐỂ DÙNG STATE) === */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="fullName"
                            placeholder="Enter member name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="email" 
                            id="email"
                            placeholder="Enter email address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select 
                            id="role"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                            value={role} 
                            onChange={(e) => setRole(e.target.value)} 
                        >
                            <option>Member</option>
                            <option>Manager</option>
                            <option>Admin</option> 
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select 
                            id="status"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:ring-red-500 focus:border-red-500"
                            style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                            value={status} 
                            onChange={(e) => setStatus(e.target.value)} 
                        >
                            <option>Active</option>
                            <option>Pending</option>
                        </select>
                    </div>

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
                            Add Member
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;