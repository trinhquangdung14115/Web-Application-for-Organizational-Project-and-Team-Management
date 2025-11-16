import React, { useState, useEffect } from 'react';
import { 
    UserPlusIcon, 
    FolderPlusIcon, 
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { mockMembers } from '../mocks/members';
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import AddMemberModal from '../components/AddMemberModal';
import AssignToProjectModal from '../components/AssignToProjectModal';

const PRIMARY_COLOR = '#f35640';

// --- Sub-components --- //
const RoleBadge = ({ role }) => {
    let colors = 'bg-gray-100 text-gray-600';
    if (role === 'Admin') colors = 'bg-indigo-100 text-indigo-700';
    if (role === 'Manager') colors = 'bg-purple-100 text-purple-700';
    if (role === 'Member') colors = 'bg-green-100 text-green-700';
    
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors}`}>
            {role}
        </span>
    );
};
const Avatar = ({ name, avatarUrl }) => {
    if (avatarUrl) {
        return <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full" />;
    }
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = ['bg-blue-100 text-blue-700', 'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-pink-100 text-pink-700'];
    const color = colors[name.length % colors.length];

    return (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${color}`}>
            {initials}
        </div>
    );
};


// --- Component Trang Chính ---
const Members = () => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [members, setMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setMembers(mockMembers);
            setIsLoading(false);
        }, 1000); 
        return () => clearTimeout(timer);
    }, []);

    const handleAddMember = (newMemberData) => {
        console.log("Adding new member:", newMemberData);
        const newMember = {
            id: `u${Date.now()}`,
            name: newMemberData.name,
            email: newMemberData.email,
            role: newMemberData.role,
            avatarUrl: null,
            stats: { done: 0, inProgress: 0, overdue: 0, total: 0 },
            completionRate: '0%',
        };
        setMembers(prevMembers => [newMember, ...prevMembers]);
    };
    
    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderContent = () => {
        if (isLoading) return <LoaderOverlay />;
        if (isError) return <ErrorState message="Failed to load members." />;
        if (members.length > 0 && filteredMembers.length === 0) {
             return <EmptyState title="No Members Found" message={`No members match your search for "${searchTerm}".`} />;
        }
        if (filteredMembers.length === 0) {
            return <EmptyState title="No Members Found" message="Get started by adding a new member." />;
        }
        
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Done</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">In Progress</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Avatar name={member.name} avatarUrl={member.avatarUrl} />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                            <div className="text-sm text-gray-500">{member.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <RoleBadge role={member.role} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{member.stats.done}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-yellow-600">{member.stats.inProgress}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{member.stats.overdue}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.stats.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header: Filters + Actions */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    {/* Filters */}
                    <div className="flex-1 w-full md:w-auto">
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input 
                                type="text"
                                placeholder="Filter by name or email..."
                                className="w-full md:max-w-xs pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-1 focus:border-red-500 focus:ring-red-500"
                                style={{'--tw-ring-color': PRIMARY_COLOR, '--tw-border-color': PRIMARY_COLOR}}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setIsAssignModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                        >
                            <FolderPlusIcon className="w-5 h-5" />
                            Assign to Project
                        </button>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            <UserPlusIcon className="w-5 h-5" />
                            Add Member
                        </button>
                    </div>
                </div>

                {/* Main Content Area (Table) */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100">
                    {renderContent()}
                </div>
            </div>

            {/* Modals */}
            <AddMemberModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)}
                onAddMember={handleAddMember}
            />
            <AssignToProjectModal 
                isOpen={isAssignModalOpen} 
                onClose={() => setIsAssignModalOpen(false)} 
            />
        </div>
    );
}

export default Members;