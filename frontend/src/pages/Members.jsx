import React, { useState, useEffect, useCallback } from 'react';
import { 
    UserPlusIcon, 
    MagnifyingGlassIcon,
    ShieldCheckIcon,
    InformationCircleIcon, 
    FolderMinusIcon,       
    FolderPlusIcon,        
    TrashIcon,             
    XMarkIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useParams } from 'react-router-dom'; 

// Components
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import AddMemberModal from '../components/AddMemberModal';
import AssignToProjectModal from '../components/AssignToProjectModal';

const PRIMARY_COLOR = '#f35640';
const API_BASE_URL = 'http://localhost:4000/api'; 

// --- Helper format ngày ---
const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// --- Sub-components --- //

const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50';
    const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
    const borderColor = type === 'success' ? 'border-green-200' : 'border-red-200';
    const Icon = type === 'success' ? CheckCircleIcon : ExclamationCircleIcon;

    return (
        <div className={`fixed top-24 right-5 z-50 flex items-center p-4 mb-4 rounded-lg shadow-lg border ${bgColor} ${textColor} ${borderColor} animate-fade-in-down`}>
            <Icon className="w-5 h-5 mr-3" />
            <div className="text-sm font-medium">{message}</div>
            <button onClick={onClose} className="ml-4 hover:bg-black/5 rounded-full p-1">
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// --- Sub-component: Confirm Modal (Hộp thoại xác nhận xóa) ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <div className="bg-red-100 p-2 rounded-full">
                        <ExclamationTriangleIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm">Delete</button>
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: Avatar ---
const Avatar = ({ name, avatarUrl }) => {
    if (avatarUrl) return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />;
    const initials = (name || "U").split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: `${PRIMARY_COLOR}20`, color: PRIMARY_COLOR }}>
            {initials}
        </div>
    );
};

// --- Role Select ---
const RoleSelect = ({ currentRole, userId, onChange, canEdit }) => {
    const getRoleStyle = (role) => {
        switch (role) {
            case 'Admin':
                return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
            case 'Manager':
                return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
            default: 
                return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
        }
    };

    const style = getRoleStyle(currentRole);

    if (!canEdit) {
        return (
            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                {currentRole}
            </span>
        );
    }

    return (
        <div className="relative inline-block">
            <select
                value={currentRole}
                onChange={(e) => onChange(userId, e.target.value)}
                className={`appearance-none cursor-pointer pl-3 pr-8 py-1 text-xs font-bold rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${style.bg} ${style.text} ${style.border}`}
            >
                <option value="Admin" className="text-gray-900 bg-white">Admin</option>
                <option value="Manager" className="text-gray-900 bg-white">Manager</option>
                <option value="Member" className="text-gray-900 bg-white">Member</option>
            </select>
            <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${style.text}`}>
                <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
};

// --- User Info Modal ---
const UserInfoModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    // Danh sách mã màu Hex cố định
    const dotColors = [
        '#ef4444', 
        '#3b82f6',
        '#22c55e', 
        '#eab308', 
        '#a855f7', 
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar name={user.name} avatarUrl={user.avatarUrl} />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-gray-600"/></button>
                </div>
                
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Role</p>
                            <span className="font-medium text-sm text-gray-900">{user.role}</span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Joined Date</p>
                            <span className="font-medium text-sm text-gray-900">{formatDate(user.createdAt)}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex justify-between">
                            Projects Participated
                            <span className="text-gray-400">{user.projects?.length || 0}</span>
                        </p>
                        {user.projects && user.projects.length > 0 ? (
                            <ul className="space-y-2">
                                {user.projects.map((p, index) => (
                                    <li key={p._id} className="flex items-center text-sm text-gray-700 bg-white p-2 rounded border border-gray-100">
                                        {/* Sử dụng style inline để đảm bảo màu luôn hiện */}
                                        <div 
                                            className="w-2 h-2 rounded-full mr-2"
                                            style={{ backgroundColor: dotColors[p.name.length % dotColors.length] }}
                                        ></div>
                                        {p.name}
                                    </li>
                                ))}
                            </ul>
                        ) : <span className="text-sm text-gray-400 italic">No projects assigned yet.</span>}
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

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null); 

    const [notification, setNotification] = useState({ message: '', type: '' });
    const [currentUserRole, setCurrentUserRole] = useState('Member');

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const getHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUserRole(JSON.parse(userStr).role || 'Member');
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const userUrl = projectId 
                ? `${API_BASE_URL}/projects/${projectId}/members` 
                : `${API_BASE_URL}/users`;

            const [usersRes, projectsRes] = await Promise.all([
                fetch(userUrl, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() })
            ]);

            if (!usersRes.ok) throw new Error('Failed to fetch data');
            
            const usersResult = await usersRes.json();
            const projectsResult = await projectsRes.json();

            const userList = usersResult.data || [];
            const projectList = projectsResult.data || [];

            const mappedMembers = userList.map(user => {
                const userId = user._id || user.id; 
                const joinedProjects = projectList.filter(proj => 
                    proj.members.some(m => (m.user === userId || m.user?._id === userId))
                );

                return {
                    id: userId,
                    name: user.name || user.fullName || "Unknown",
                    email: user.email || "",
                    role: user.role || 'Member',
                    avatarUrl: user.avatar || null,
                    createdAt: user.createdAt, // Lấy ngày tạo
                    projects: joinedProjects
                };
            });

            setMembers(mappedMembers);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- ACTIONS ---
    const handleChangeRole = async (userId, newRole) => {
        const oldMembers = [...members];
        setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));

        try {
            const res = await fetch(`${API_BASE_URL}/auth/${userId}/role`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ role: newRole })
            });
            if (!res.ok) throw new Error("Failed");
            showNotification("Role updated successfully!", "success");
        } catch (error) {
            setMembers(oldMembers); 
            showNotification("Failed to update role.", "error");
        }
    };

    const handleInfo = (user) => { setSelectedUser(user); setIsInfoModalOpen(true); };
    const handleAssign = (user) => { setSelectedUser(user); setIsAssignModalOpen(true); };
    const handleDeleteClick = (user) => { setUserToDelete(user); };

    // Hàm thực hiện xóa thật (Chạy khi bấm Delete trong Modal)
    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        setMembers(prev => prev.filter(m => m.id !== userToDelete.id));
        setUserToDelete(null); 

        try {
             const res = await fetch(`${API_BASE_URL}/users/${userToDelete.id}`, { method: 'DELETE', headers: getHeaders() });
             if (!res.ok) throw new Error("Delete failed");
             showNotification("User deleted successfully", "success");
        } catch (error) { 
            fetchData(); 
            showNotification("Failed to delete user", "error");
        }
    };

    const filteredMembers = members.filter(member =>
        (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isAdmin = currentUserRole === 'Admin';

    return (
        <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            <ConfirmModal isOpen={!!userToDelete} title="Delete User" message={`Are you sure you want to delete "${userToDelete?.name}"?`} onClose={() => setUserToDelete(null)} onConfirm={confirmDeleteUser} />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-auto">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="text" placeholder="Search members..." className="w-full md:w-96 pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 shadow-sm" style={{ '--tw-ring-color': PRIMARY_COLOR }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    {isAdmin && (
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-all active:scale-95" style={{ backgroundColor: PRIMARY_COLOR }}>
                            <UserPlusIcon className="w-5 h-5" /> Add Member
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isAdmin && (
                        <div className="px-6 py-3 border-b flex justify-between items-center" style={{ backgroundColor: `${PRIMARY_COLOR}08`, borderColor: `${PRIMARY_COLOR}20` }}>
                            <div className="flex items-center gap-2">
                                <ShieldCheckIcon className="w-5 h-5" style={{ color: PRIMARY_COLOR }} />
                                <span className="text-sm font-bold" style={{ color: PRIMARY_COLOR }}>Admin Management Mode</span>
                            </div>
                        </div>
                    )}
                    
                    {isLoading ? <LoaderOverlay /> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Projects Joined</th>
                                        {isAdmin && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-gray-50 group transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Avatar name={member.name} avatarUrl={member.avatarUrl} />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-gray-900">{member.name}</div>
                                                        <div className="text-sm text-gray-500">{member.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <RoleSelect currentRole={member.role} userId={member.id} onChange={handleChangeRole} canEdit={isAdmin} />
                                            </td>
                                            
                                            {/* Projects Joined: Chỉ hiện số lượng */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span 
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ 
                                                        backgroundColor: `${PRIMARY_COLOR}20`, 
                                                        color: PRIMARY_COLOR 
                                                    }}
                                                >
                                                    {member.projects?.length || 0} Projects
                                                </span>
                                            </td>
                                            
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleInfo(member)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50" title="View Info">
                                                            <InformationCircleIcon className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => showNotification("Remove from project: Coming soon", "error")} className="text-gray-400 hover:text-orange-600 p-1 rounded-full hover:bg-orange-50" title="Remove from Project">
                                                            <FolderMinusIcon className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleAssign(member)} className="text-gray-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50" title="Assign to Project">
                                                            <FolderPlusIcon className="w-5 h-5" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(member)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50" title="Delete User">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
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

            {/* Modals */}
            <AddMemberModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onAddMember={() => { setIsAddModalOpen(false); fetchData(); showNotification("Member added successfully!", "success"); }} 
            />
            <AssignToProjectModal 
                isOpen={isAssignModalOpen} 
                onClose={() => setIsAssignModalOpen(false)}
                onAssignSuccess={() => { fetchData(); showNotification("Assigned to project successfully!", "success"); }}
            />
            <UserInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} user={selectedUser} />
        </div>
    );
}

export default Members;