import React, { useState, useEffect } from 'react'; 
import { XMarkIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = '#f35640'; 
const API_BASE_URL = 'http://localhost:4000/api';

const AddMemberModal = ({ isOpen, onClose, onAddMember }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setName(''); setEmail(''); setPassword(''); setErrors({});
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = "Name is required.";
        if (!email.trim()) newErrors.email = "Email is required.";
        if (!password || password.length < 6) newErrors.password = "Password must be at least 6 characters.";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }) 
            });

            if (!response.ok) {
                const data = await response.json();
                setErrors({ email: data.error?.message || "Failed to create user." });
                return;
            }

            if (onAddMember) onAddMember(); 
            onClose();
        } catch (error) {
            setErrors({ form: "Server connection error." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getInputClass = (fieldName) => `w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-red-500 ${errors[fieldName] ? 'border-red-500 bg-red-50' : 'border-gray-300'}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Add New Member</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.form && <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">{errors.form}</div>}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                        {/* Đã sửa placeholder */}
                        <input type="text" className={getInputClass('name')} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter member name" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                        {/* Đã sửa placeholder */}
                        <input type="email" className={getInputClass('email')} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email address" />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                        <input type="password" className={getInputClass('password')} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password (min 6 chars)" />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm bg-white border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {isSubmitting ? 'Creating...' : 'Add Member'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMemberModal;