import React, { useState, useEffect, useCallback } from 'react';
import { 
    MagnifyingGlassIcon, InformationCircleIcon, FolderMinusIcon, FolderPlusIcon, TrashIcon, 
    XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, ShieldCheckIcon, 
    ExclamationTriangleIcon, UserPlusIcon, FunnelIcon, 
    QrCodeIcon, ClipboardDocumentIcon, ArrowPathIcon 
} from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom'; 

import { LoaderOverlay } from '../components/LoaderOverlay';
import AddMemberModal from '../components/AddMemberModal';
import AssignToProjectModal from '../components/AssignToProjectModal';

const API_BASE_URL = 'http://localhost:4000/api'; 

// --- Helper Functions ---
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
});

// --- SUB-COMPONENTS ---

// Notification Banner
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div className={`fixed top-24 right-5 z-[100] flex items-center p-4 mb-4 rounded-lg shadow-lg border animate-fade-in-down ${isSuccess ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {isSuccess ? <CheckCircleIcon className="w-5 h-5 mr-3" /> : <ExclamationCircleIcon className="w-5 h-5 mr-3" />}
            <div className="text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// Modal Xác Nhận 
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", isDanger = true }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className={`flex items-center gap-3 mb-4 ${isDanger ? 'text-red-600' : 'text-gray-800'}`}>
                    <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100' : 'bg-orange-50'}`}>
                        {isDanger ? <ExclamationTriangleIcon className="w-6 h-6" /> : <FolderMinusIcon className="w-6 h-6" style={{ color: 'var(--color-brand)' }} />}
                    </div>
                    <h3 className="text-lg font-bold">{title}</h3>
                </div>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
                
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all hover:opacity-90 ${isDanger ? 'bg-red-600' : ''}`} 
                        style={!isDanger ? { backgroundColor: 'var(--color-brand)' } : {}}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal Chọn Project
const SelectProjectModal = ({ isOpen, onClose, user, onSelectProject }) => {
    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Remove from Project</h3>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                </div>
                <p className="text-sm text-gray-600 mb-4">User <strong>{user.name}</strong> is in multiple projects. Select one to remove:</p>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {user.projects.map(proj => (
                        <button key={proj._id} onClick={() => onSelectProject(proj._id, proj.name)} className="w-full flex justify-between items-center p-3 text-sm border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors group">
                            <span className="font-medium group-hover:text-[var(--color-brand)]">{proj.name}</span>
                            <FolderMinusIcon className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-brand)]" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- INVITE MODAL (ĐÃ FIX: BỎ ALERT CONFIRM) ---
const InviteModal = ({ isOpen, onClose, projectId, showNotification }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Lấy mã khi mở modal
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

    // Reset mã - Bấm là chạy luôn, không hỏi
    const handleReset = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${projectId}/invite-code`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setInviteCode(data.code);
                // Không cần thông báo để trải nghiệm mượt mà, hoặc chỉ nháy nhẹ UI
            }
        } catch (err) {
            console.error("Reset failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(inviteCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        showNotification("Invite code copied to clipboard!", "success");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <QrCodeIcon className="w-6 h-6 text-[var(--color-brand)]"/> Project Invite Code
                    </h3>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center mb-6">
                    {isLoading ? <p className="text-gray-500 animate-pulse">Generating...</p> : (
                        <>
                            <div className="text-4xl font-mono font-bold text-gray-800 tracking-wider mb-2 select-all">
                                {inviteCode || "------"}
                            </div>
                            <p className="text-xs text-gray-500">Share this code with your team members</p>
                        </>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleCopy} 
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${copySuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                    >
                        {copySuccess ? <CheckCircleIcon className="w-5 h-5"/> : <ClipboardDocumentIcon className="w-5 h-5"/>}
                        {copySuccess ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button 
                        onClick={handleReset} 
                        disabled={isLoading}
                        className="px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition-colors"
                        title="Generate New Code"
                    >
                        <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const Avatar = ({ name, avatarUrl }) => {
    if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    const initials = (name || "U").split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, white)', color: 'var(--color-brand)' }}>
            {initials}
        </div>
    );
};

// Role Select
const RoleSelect = ({ currentRole, userId, onChange, canEdit }) => {
    const getRoleStyle = (role) => {
        const r = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : 'Member';
        switch (r) {
            case 'Admin': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Manager': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };
    
    const displayRole = currentRole ? currentRole.charAt(0).toUpperCase() + currentRole.slice(1).toLowerCase() : 'Member';
    const currentStyle = getRoleStyle(displayRole);

    if (!canEdit) return <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${currentStyle}`}>{displayRole}</span>;
    return (
        <div className="relative inline-block">
            <select value={displayRole} onChange={(e) => onChange(userId, e.target.value)} className={`appearance-none cursor-pointer pl-3 pr-8 py-1 text-xs font-bold rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${currentStyle}`}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Member">Member</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500"><svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg></div>
        </div>
    );
};

// User Info Modal
const UserInfoModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar name={user.name} avatarUrl={user.avatarUrl} />
                        <div><h3 className="text-lg font-bold text-gray-900">{user.name}</h3><p className="text-sm text-gray-500">{user.email}</p></div>
                    </div>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Role</p><span className="font-medium text-sm text-gray-900">{user.role}</span></div>
                        <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs font-semibold text-gray-500 uppercase mb-1">Joined</p><span className="font-medium text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span></div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto custom-scrollbar">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Projects</p>
                        <ul className="space-y-2">
                            {user.projects?.map(p => <li key={p._id} className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-100">{p.name}</li>)}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const Members = () => {
    const { id: projectId } = useParams(); 
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    // Auth & Filter
    const [currentUserRole, setCurrentUserRole] = useState('Member');
    const [availableProjects, setAvailableProjects] = useState([]); 
    const [selectedProjectId, setSelectedProjectId] = useState('all'); 

    // Action States
    const [deleteUserModal, setDeleteUserModal] = useState(null); 
    const [removeProjectConfirm, setRemoveProjectConfirm] = useState(null); 
    const [selectProjectModal, setSelectProjectModal] = useState(null); 

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            setCurrentUserRole(JSON.parse(userStr).role || 'Member');
        }
    }, []);

    // 1. Fetch Projects for Filter
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() });
                const data = await res.json();
                if (data.success) {
                    setAvailableProjects(data.data || []);
                    const userStr = localStorage.getItem('user');
                    const userRole = userStr ? JSON.parse(userStr).role : 'Member';
                    if(userRole !== 'Admin' && data.data && data.data.length > 0) {
                        setSelectedProjectId(data.data[0]._id);
                    }
                }
            } catch (err) { console.error(err); }
        };
        fetchProjects();
    }, []);

    // 2. Fetch Members
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const userRole = userStr ? JSON.parse(userStr).role : 'Member';
            const targetProjectId = projectId || (selectedProjectId !== 'all' ? selectedProjectId : null);

            // A: View 1 Project
            if (targetProjectId) {
                const res = await fetch(`${API_BASE_URL}/projects/${targetProjectId}/members`, { headers: getHeaders() });
                if (!res.ok) throw new Error('Access denied');
                const data = await res.json();
                const mapped = (data.data || []).map(m => ({
                    id: m.user.id || m.user._id,
                    name: m.user.name,
                    email: m.user.email,
                    role: m.role, // Project Role
                    systemRole: m.user.role, 
                    avatarUrl: m.user.avatar,
                    createdAt: m.createdAt,
                    projects: [],
                    membershipId: m._id // QUAN TRỌNG: ID để xóa khỏi dự án
                }));
                setMembers(mapped);
            } 
            // B: View All (Admin)
            else if (userRole === 'Admin') {
                const [usersRes, projectsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }),
                    fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() })
                ]);

                if (!usersRes.ok) throw new Error('Failed');
                const usersData = await usersRes.json();
                const projectsData = await projectsRes.json();
                const allProjects = projectsData.data || [];

                const mapped = (usersData.data || []).map(u => {
                    const uid = u._id || u.id;
                    const joined = allProjects.filter(p => p.members.some(m => String(m.user._id || m.user) === String(uid)));
                    return {
                        id: uid,
                        name: u.name,
                        email: u.email,
                        role: u.role, 
                        createdAt: u.createdAt,
                        projects: joined,
                        membershipId: null 
                    };
                });
                setMembers(mapped);
            }
        } catch (error) { 
            console.error(error); 
        } finally { setIsLoading(false); }
    }, [projectId, selectedProjectId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleChangeRole = async (userId, newRole) => { /*...*/ };

    // --- FIX: REMOVE MEMBER (Tìm đúng ID để xóa) ---
    const handleRemoveClick = (member) => {
        if (selectedProjectId !== 'all') {
            // Đã có MembershipID -> Dùng luôn
            setRemoveProjectConfirm({ 
                user: member, 
                targetProjectId: selectedProjectId, 
                projectName: 'this project',
                membershipId: member.membershipId 
            });
        } else if (member.projects && member.projects.length > 0) {
            // Nếu ở view tổng Admin -> Phải chọn project
            if (member.projects.length === 1) {
                setRemoveProjectConfirm({ 
                    user: member, 
                    targetProjectId: member.projects[0]._id, 
                    projectName: member.projects[0].name 
                    // membershipId sẽ được tìm trong executeRemoveMember
                });
            } else {
                setSelectProjectModal(member);
            }
        } else {
            showNotification("User not in any project", "error");
        }
    };

      // --- Xoa Member khoi project (Tìm Membership ID) ---
    const executeRemoveMember = async () => {
        if (!removeProjectConfirm) return;
        const { user, targetProjectId, membershipId } = removeProjectConfirm;
        let idToDelete = membershipId;

        try {
            // Nếu chưa có ID (do chọn từ view tổng), phải tìm ID bản ghi trong Project
            if (!idToDelete) {
                // Fetch lại chi tiết members của project đó để tìm ID
                const res = await fetch(`${API_BASE_URL}/projects/${targetProjectId}/members`, { headers: getHeaders() });
                const data = await res.json();
                const targetMember = data.data.find(m => String(m.user._id || m.user.id) === String(user.id));
                if(targetMember) idToDelete = targetMember._id;
            }

            if (!idToDelete) throw new Error("Could not find membership record.");

            const res = await fetch(`${API_BASE_URL}/projects/${targetProjectId}/members/${idToDelete}`, {
                method: 'DELETE', headers: getHeaders()
            });
            
            if (!res.ok) throw new Error("Failed");
            
            showNotification("Member removed", "success");
            setRemoveProjectConfirm(null);
            fetchData();
        } catch (error) { 
            console.error(error);
            showNotification("Failed to remove member", "error"); 
        }
    };

    // --- DELETE SYSTEM USER ---
    const handleDeleteUser = async () => {
        if (!deleteUserModal) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/${deleteUserModal.id}`, { 
                method: 'DELETE', 
                headers: getHeaders() 
            });
            if (!res.ok) throw new Error("Failed");
            showNotification("User deleted permanently", "success");

            // Xóa ngay lập tức khỏi giao diện
            setMembers(prev => prev.filter(m => m.id !== deleteUserModal.id));

            // Đóng Modal
            setDeleteUserModal(null);
        } catch (error) { showNotification("Failed to delete user", "error"); }
    };

    const handleInfo = (user) => { setSelectedUser(user); setIsInfoModalOpen(true); };
    const handleAssign = (user) => { setSelectedUser(user); setIsAssignModalOpen(true); };

    const filteredMembers = members.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isAdmin = currentUserRole === 'Admin';
    const isProjectView = selectedProjectId !== 'all' || projectId; 
    const canInvite = isProjectView && (isAdmin || currentUserRole === 'Manager');

    return (
        <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />

            {/* Modals Confirm */}
            <ConfirmModal isOpen={!!deleteUserModal} title="Delete User" message="Permanently delete this user?" onClose={() => setDeleteUserModal(null)} onConfirm={handleDeleteUser} confirmText="Delete" isDanger={true} />
            <ConfirmModal isOpen={!!removeProjectConfirm} title="Remove Member" message="Remove from project?" onClose={() => setRemoveProjectConfirm(null)} onConfirm={executeRemoveMember} confirmText="Remove" isDanger={false} />

            <SelectProjectModal isOpen={!!selectProjectModal} user={selectProjectModal} onClose={() => setSelectProjectModal(null)} onSelectProject={(pId, pName) => { setSelectProjectModal(null); setRemoveProjectConfirm({ user: selectProjectModal, targetProjectId: pId, projectName: pName }); }} />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search..." className="w-full md:w-64 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 shadow-sm text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        {availableProjects.length > 0 && (
                            <div className="relative">
                                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <select className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none bg-white text-sm font-medium text-gray-700 cursor-pointer" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                                    {isAdmin && <option value="all">All Members</option>}
                                    <optgroup label="Select a Project">
                                        {availableProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </optgroup>
                                </select>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {canInvite && <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium shadow-sm"><QrCodeIcon className="w-5 h-5 text-[var(--color-brand)]" /><span>Invite</span></button>}
                        {(isAdmin || (isProjectView && currentUserRole === 'Manager')) && <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-sm" style={{ backgroundColor: 'var(--color-brand)' }}><UserPlusIcon className="w-5 h-5" /><span>Add Member</span></button>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isAdmin && !isProjectView && (
                        <div className="px-6 py-3 border-b flex items-center gap-2" style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 5%, white)', borderColor: 'color-mix(in srgb, var(--color-brand) 20%, white)' }}>
                            <ShieldCheckIcon className="w-5 h-5" style={{ color: 'var(--color-brand)' }} />
                            <span className="text-sm font-bold" style={{ color: 'var(--color-brand)' }}>Admin Management Mode</span>
                        </div>
                    )}
                    
                    {isLoading ? <LoaderOverlay /> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Member</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">{isProjectView ? 'Project Role' : 'System Role'}</th>
                                        {!isProjectView && <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Projects Joined</th>}
                                        {(isAdmin || isProjectView) && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={member.name} avatarUrl={member.avatarUrl} /><div><div className="text-sm font-bold text-gray-900">{member.name}</div><div className="text-sm text-gray-500">{member.email}</div></div></div></td>
                                            <td className="px-6 py-4"><RoleSelect currentRole={member.role} userId={member.id} onChange={handleChangeRole} canEdit={isAdmin && !isProjectView} /></td>
                                            {!isProjectView && <td className="px-6 py-4"><span className="px-2 py-1 text-xs bg-gray-100 rounded-full">{member.projects?.length || 0} Projects</span></td>}
                                            {(isAdmin || (isProjectView && currentUserRole === 'Manager')) && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <button onClick={() => handleInfo(member)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50"><InformationCircleIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => handleRemoveClick(member)} className="text-gray-400 hover:text-orange-600 p-1 rounded-full hover:bg-orange-50"><FolderMinusIcon className="w-5 h-5" /></button>
                                                        {isAdmin && <><button onClick={() => handleAssign(member)} className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50"><FolderPlusIcon className="w-5 h-5" /></button><button onClick={() => setDeleteUserModal(member)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50"><TrashIcon className="w-5 h-5" /></button></>}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} projectId={selectedProjectId !== 'all' ? selectedProjectId : projectId} showNotification={showNotification} />
            <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAddMember={() => { setIsAddModalOpen(false); fetchData(); showNotification("Member added", "success"); }} />
            <AssignToProjectModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} user={selectedUser} onAssignSuccess={() => { fetchData(); showNotification("Assigned successfully", "success"); }} />
            <UserInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} user={selectedUser} />
        </div>
    );
}

export default Members;