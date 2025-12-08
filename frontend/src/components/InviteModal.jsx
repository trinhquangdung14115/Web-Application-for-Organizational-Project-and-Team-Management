import React, { useState, useEffect } from 'react';
import { 
    XMarkIcon, QrCodeIcon, ClipboardDocumentIcon, ArrowPathIcon, CheckCircleIcon 
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:4000/api';

const InviteModal = ({ isOpen, onClose, projectId }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    // Lấy mã mời khi mở modal
    useEffect(() => {
        if (isOpen && projectId) {
            setIsLoading(true);
            fetch(`${API_BASE_URL}/projects/${projectId}/invite-code`, { headers: getHeaders() })
                .then(res => res.json())
                .then(data => {
                    if (data.success) setInviteCode(data.code);
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, projectId]);

    // Reset mã
    const handleReset = async () => {
        if (!window.confirm("Reset code? The old code will expire.")) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/invite-code`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.success) setInviteCode(data.code);
        } catch (err) {
            alert("Error resetting code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <QrCodeIcon className="w-6 h-6 text-[var(--color-brand)]"/> Project Invite Code
                    </h3>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-500"/></button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mb-6">
                    {isLoading ? <p className="text-gray-400">Loading...</p> : (
                        <>
                            <div className="text-3xl font-mono font-bold text-gray-800 tracking-widest select-all">
                                {inviteCode || "----"}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Share this code to invite members</p>
                        </>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleCopy}
                        className={`flex-1 py-2.5 rounded-lg border font-medium flex justify-center items-center gap-2 transition-colors
                            ${copySuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        {copySuccess ? <CheckCircleIcon className="w-5 h-5"/> : <ClipboardDocumentIcon className="w-5 h-5"/>}
                        {copySuccess ? "Copied!" : "Copy Code"}
                    </button>
                    <button 
                        onClick={handleReset}
                        className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100"
                        title="Generate New Code"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InviteModal;