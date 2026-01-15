import React, { useState, useEffect, useCallback } from 'react';
import { 
    ChevronLeftIcon, ChevronRightIcon, ClockIcon, MapPinIcon, PlusIcon, XMarkIcon,
    VideoCameraIcon, CalendarIcon, Bars3BottomLeftIcon, BriefcaseIcon,
    ShieldCheckIcon, UserGroupIcon, TrashIcon, PencilIcon, 
    CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon
} from '@heroicons/react/24/outline'; 
import { useOutletContext } from 'react-router-dom';
import { useProject } from '../context/ProjectContext'; 
import { useAuth } from '../services/AuthContext'; // ✅ THÊM DÒNG NÀY
import { LoaderOverlay } from '../components/LoaderOverlay';
import TaskSummary from '../components/TaskSummary'; 
import { CalendarDayCell } from '../components/CalendarDayCell';
import axiosInstance from '../services/api';

const API_BASE_URL = 'http://localhost:4000/api';

// --- HELPER FUNCTIONS ---
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
});

// --- UTILS ---
const normalizeDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatTimeUS = (dateInput) => new Date(dateInput).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
const formatDateUS = (dateInput) => new Date(dateInput).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

// --- NOTIFICATION BANNER ---
const NotificationBanner = ({ message, type, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

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

// --- CONFIRM MODAL ---
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <TrashIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6">{message}</p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition shadow-md">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- IP MANAGEMENT MODAL ---
const IPManagementModal = ({ isOpen, onClose, showNotification }) => {
    const [ips, setIps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ ip: '', description: '', isActive: true });
    const [editingId, setEditingId] = useState(null);
    
    // Confirm Modal State
    const [deleteId, setDeleteId] = useState(null);

    const fetchIPs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/attendance/whitelist`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success) {
                setIps(data.data.allowedIps || []);
            }
        } catch (err) { 
            console.error("Fetch IP error:", err); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleGetMyIP = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/attendance/my-ip`, { headers: getHeaders() });
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({ ...prev, ip: data.data.ip }));
                showNotification("IP fetched successfully", "success");
            }
        } catch (err) { 
            showNotification("Failed to get IP", "error"); 
        }
    };

    useEffect(() => { 
        if (isOpen) { 
            fetchIPs(); 
            setEditingId(null);
            setFormData({ ip: '', description: '', isActive: true });
        } 
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId ? `${API_BASE_URL}/attendance/whitelist-ip/${editingId}` : `${API_BASE_URL}/attendance/whitelist-ip`;
            const method = editingId ? 'PUT' : 'POST';
            
            const res = await fetch(url, { method, headers: getHeaders(), body: JSON.stringify(formData) });
            const data = await res.json();
            
            if (data.success) {
                showNotification(editingId ? "IP updated" : "IP added", "success");
                await fetchIPs();
                setFormData({ ip: '', description: '', isActive: true });
                setEditingId(null);
            } else { 
                showNotification(data.message || "Action failed", "error");
            }
        } catch (err) { 
            showNotification("Connection error", "error"); 
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/attendance/whitelist-ip/${deleteId}`, { method: 'DELETE', headers: getHeaders() });
            const data = await res.json();
            if (res.ok) {
                showNotification("IP removed successfully", "success");
                fetchIPs();
            } else {
                showNotification(data.message || "Failed to delete", "error");
            }
        } catch (err) { 
            showNotification("Error deleting IP", "error"); 
        } finally {
            setDeleteId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            {/* --- Confirm Delete Modal inside IP Modal --- */}
            <ConfirmModal 
                isOpen={!!deleteId} 
                onClose={() => setDeleteId(null)} 
                onConfirm={handleDelete}
                title="Delete IP Address"
                message="Are you sure you want to remove this IP from the whitelist? This action cannot be undone."
            />

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-[var(--color-brand)]"><ShieldCheckIcon className="w-6 h-6"/></div>
                        IP Whitelist Management
                    </h3>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-400 hover:text-[var(--color-brand)] transition-colors"/></button>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                        <div className="md:col-span-5">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">IP Address</label>
                            <div className="flex gap-2">
                                <input type="text" required className="flex-1 p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]" value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} placeholder="192.168.1.1"/>
                                <button type="button" onClick={handleGetMyIP} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">Get My IP</button>
                            </div>
                        </div>
                        <div className="md:col-span-5">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Description</label>
                            <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand)]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="e.g. Office Wifi"/>
                        </div>
                        <div className="md:col-span-2 flex items-end">
                             <button type="submit" className="w-full py-2.5 text-white font-bold rounded-lg shadow hover:opacity-90 text-sm transition-colors flex justify-center items-center gap-2" style={{ backgroundColor: 'var(--color-brand)' }}>
                                {editingId ? <PencilIcon className="w-4 h-4"/> : <PlusIcon className="w-4 h-4"/>}
                                {editingId ? 'Update' : 'Add'}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-[var(--color-brand)] rounded border-gray-300 focus:ring-[var(--color-brand)]"/>
                            <span className="text-sm text-gray-600 font-medium">Active Status</span>
                        </label>
                        {editingId && <button type='button' onClick={() => { setEditingId(null); setFormData({ ip: '', description: '', isActive: true }); }} className='text-xs text-red-500 hover:text-red-700 font-medium underline decoration-dashed'>Cancel Edit</button>}
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl bg-white relative min-h-[300px]">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-bold border-b tracking-wider">IP Address</th>
                                <th className="px-6 py-4 font-bold border-b tracking-wider">Description</th>
                                <th className="px-6 py-4 font-bold border-b text-center tracking-wider">Status</th>
                                <th className="px-6 py-4 font-bold border-b text-right tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-20 text-gray-400">Loading data...</td></tr>
                            ) : ips.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="text-center py-24">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="bg-gray-50 p-4 rounded-full mb-3"><ShieldCheckIcon className="w-10 h-10 text-gray-300"/></div>
                                            <p className="text-base font-medium text-gray-500">No IPs in whitelist</p>
                                            <p className="text-xs text-gray-400 mt-1">Add an IP above to restrict attendance check-in</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ips.map((item) => (
                                    <tr key={item._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-gray-800 font-medium text-sm">{item.ip}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.description || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${item.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setFormData({ip: item.ip, description: item.description, isActive: item.isActive}); setEditingId(item._id); }} className="p-2 text-[var(--color-brand)] bg-gray-100 rounded-lg hover:bg-gray-200 transition" title="Edit">
                                                    <PencilIcon className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => setDeleteId(item._id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition" title="Delete">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ReportDetailModal = ({ isOpen, onClose, title, data, type }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 backdrop-blur-[1px]" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-0 overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className={`px-4 py-3 flex justify-between items-center ${type === 'LATE' ? 'bg-orange-50 border-b border-orange-100' : 'bg-red-50 border-b border-red-100'}`}>
                    <h4 className={`font-bold text-sm ${type === 'LATE' ? 'text-orange-800' : 'text-red-800'}`}>
                        {title}
                    </h4>
                    <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full transition-colors">
                        <XMarkIcon className={`w-4 h-4 ${type === 'LATE' ? 'text-orange-800' : 'text-red-800'}`} />
                    </button>
                </div>

                {/* List Content */}
                <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                    {data && data.length > 0 ? (
                        <div className="space-y-1">
                            {data.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg text-sm border border-transparent hover:border-gray-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${type === 'LATE' ? 'bg-orange-500' : 'bg-red-500'}`}></div>
                                        <span className="font-medium text-gray-700">{item.date}</span>
                                    </div>
                                    {/* Nếu là Late thì hiện giờ, Absent thì hiện note (nếu có) */}
                                    {type === 'LATE' ? (
                                        <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                            {item.time}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Absent</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-400 text-xs">No records found.</div>
                    )}
                </div>
                
                {/* Footer Summary */}
                <div className="bg-gray-50 px-4 py-2 text-right border-t border-gray-100">
                    <span className="text-xs text-gray-500">Total: <b>{data.length}</b> records</span>
                </div>
            </div>
        </div>
    );
};

// --- ATTENDANCE REPORT MODAL ---
const AttendanceReportModal = ({ isOpen, onClose }) => {
    const { selectedProjectId, selectedProjectName } = useProject();
    
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    // State cho Modal chi tiết
    const [detailModal, setDetailModal] = useState({ isOpen: false, title: '', data: [], type: '' });

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const year = selectedMonth.getFullYear();
            const month = selectedMonth.getMonth();
            const startDate = new Date(year, month, 1).toISOString();
            const endDate = new Date(year, month + 1, 0).toISOString();

            const params = new URLSearchParams({ startDate, endDate });
            if (selectedProjectId && selectedProjectId !== 'all') {
                params.append('projectId', selectedProjectId);
            }

            const res = await fetch(`${API_BASE_URL}/attendance/all?${params.toString()}`, { headers: getHeaders() });
            const data = await res.json();
            
            if (data.success) {
                setReportData(data.data || []);
            }
        } catch (err) { 
            console.error("Fetch Report Error:", err); 
        } finally { 
            setLoading(false); 
        }
    }, [selectedMonth, selectedProjectId]);

    useEffect(() => {
        if (isOpen) fetchReport();
    }, [isOpen, fetchReport]);

    const changeMonth = (offset) => {
        setSelectedMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    // Hàm mở modal chi tiết
    const openDetails = (user, type) => {
        if (type === 'LATE' && user.late > 0) {
            setDetailModal({
                isOpen: true,
                title: `Late Records: ${user.name}`,
                data: user.lateDetails, // Backend trả về mảng [{date, time}, ...]
                type: 'LATE'
            });
        } else if (type === 'ABSENT' && user.absent > 0) {
            setDetailModal({
                isOpen: true,
                title: `Absence Records: ${user.name}`,
                data: user.absentDetails, // Backend trả về mảng [{date, note}, ...]
                type: 'ABSENT'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            
            {/* Modal Detail */}
            <ReportDetailModal 
                isOpen={detailModal.isOpen} 
                onClose={() => setDetailModal({ ...detailModal, isOpen: false })} 
                title={detailModal.title}
                data={detailModal.data}
                type={detailModal.type}
            />

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl p-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <UserGroupIcon className="w-6 h-6 text-[var(--color-brand)]"/> 
                            Attendance Report
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Scope: <span className="font-semibold text-gray-800">{selectedProjectId === 'all' ? 'All Organization' : selectedProjectName}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow rounded-md transition-all text-gray-600"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <span className="text-sm font-bold text-gray-800 min-w-[140px] text-center select-none">
                            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:shadow rounded-md transition-all text-gray-600"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"><XMarkIcon className="w-6 h-6"/></button>
                </div>

                {/* TABLE */}
                <div className="flex-1 overflow-auto border border-gray-200 rounded-xl min-h-[400px] bg-white">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="bg-gray-50 text-xs text-gray-700 uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 font-bold border-b">Member</th>
                                <th className="px-6 py-4 font-bold border-b text-center w-[15%]">Total Check-ins</th>
                                <th className="px-6 py-4 font-bold border-b text-center w-[15%]">On Time</th>
                                <th className="px-6 py-4 font-bold border-b text-center w-[15%]">Late (Days)</th>
                                <th className="px-6 py-4 font-bold border-b text-center w-[15%]">Absent (Days)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-400">Loading data...</td></tr>
                            ) : reportData.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-400">No members found in this scope.</td></tr>
                            ) : (
                                reportData.map((user) => (
                                    <tr key={user.userId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-white shadow-sm shrink-0">
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{user.name}</div>
                                                    <div className="text-xs text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4 text-center font-medium text-gray-600">
                                            {user.totalCheckins}
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${user.present > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                                                {user.present}
                                            </span>
                                        </td>

                                        {/* NÚT BẤM XEM CHI TIẾT MUỘN */}
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openDetails(user, 'LATE')}
                                                disabled={user.late === 0}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                                    user.late > 0 
                                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer underline decoration-dotted underline-offset-2' 
                                                    : 'bg-gray-100 text-gray-400 cursor-default'
                                                }`}
                                            >
                                                {user.late}
                                            </button>
                                        </td>

                                        {/* NÚT BẤM XEM CHI TIẾT NGHỈ */}
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => openDetails(user, 'ABSENT')}
                                                disabled={user.absent === 0}
                                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                                                    user.absent > 0 
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 cursor-pointer underline decoration-dotted underline-offset-2' 
                                                    : 'bg-gray-100 text-gray-400 cursor-default'
                                                }`}
                                            >
                                                {user.absent}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- MEETING DETAIL MODAL ---
const MeetingDetailModal = ({ isOpen, onClose, meeting, projects, onDeleteSuccess, canDelete, showNotification }) => {
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    if (!isOpen || !meeting) return null;
    const projectName = projects.find(p => p._id === meeting.projectId)?.name || 'Unknown Project';

    const handleDelete = async () => {
        try {
            await fetch(`${API_BASE_URL}/meetings/${meeting._id}`, { method: 'DELETE', headers: getHeaders() });
            onDeleteSuccess(); 
            setShowConfirmDelete(false);
            onClose();
        } catch (err) { 
            showNotification("Error deleting meeting", "error"); 
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            {/* Confirm Dialog inside Meeting Modal */}
            <ConfirmModal 
                isOpen={showConfirmDelete} 
                onClose={() => setShowConfirmDelete(false)} 
                onConfirm={handleDelete}
                title="Delete Meeting"
                message="Are you sure you want to delete this meeting?"
            />

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-bold">{meeting.title}</h3><button onClick={onClose}><XMarkIcon className="w-6 h-6 hover:text-gray-700"/></button></div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded"><BriefcaseIcon className="w-5 h-5 text-[var(--color-brand)]" /><span className="font-bold text-sm">{projectName}</span></div>
                    <div className="flex items-center gap-3"><ClockIcon className="w-5 h-5 text-gray-500" /><div><p className="text-sm font-bold">{formatDateUS(meeting.startTime)}</p><p className="text-sm text-gray-500">{formatTimeUS(meeting.startTime)} - {formatTimeUS(meeting.endTime)}</p></div></div>
                    <div className="flex items-center gap-3"><MapPinIcon className="w-5 h-5 text-red-500"/><span className="text-sm">{meeting.location}</span></div>
                    {meeting.description && <div className="flex gap-3 border-t pt-3"><Bars3BottomLeftIcon className="w-5 h-5 text-gray-400"/><p className="text-sm text-gray-600">{meeting.description}</p></div>}
                </div>
                <div className="mt-6 flex justify-between">
                    {canDelete && <button onClick={() => setShowConfirmDelete(true)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-bold flex items-center gap-2"><TrashIcon className="w-4 h-4"/> Delete</button>}
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-bold ml-auto hover:bg-gray-200">Close</button>
                </div>
            </div>
        </div>
    );
};

// --- CREATE MEETING MODAL ---
const CreateMeetingModal = ({ isOpen, onClose, projects, onSuccess, showNotification }) => {
    const { selectedProjectId } = useProject();
    const [formData, setFormData] = useState({ title: '', projectId: '', startTime: '', endTime: '', location: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            let defaultId = '';
            if (selectedProjectId && selectedProjectId !== 'all') defaultId = selectedProjectId;
            else if (projects.length > 0) defaultId = projects[0]._id;
            setFormData(prev => ({ ...prev, projectId: defaultId }));
        }
    }, [isOpen, projects, selectedProjectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                title: formData.title,
                projectId: formData.projectId,
                startTime: formData.startTime,
                endTime: formData.endTime,
                location: formData.location,
                description: formData.description
            };

            const res = await axiosInstance.post(`/projects/${formData.projectId}/meetings`, payload);
            
            if (res.data.success) {
                onSuccess(); 
                onClose(); 
                // Reset form
                setFormData({ title: '', projectId: '', startTime: '', endTime: '', location: '', description: '' });
            }
        } catch (err) { 
            showNotification(err.response?.data?.message || err.message, "error"); 
        } finally { 
            setIsSubmitting(false); 
        }
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-bold">New Meeting</h3><button onClick={onClose}><XMarkIcon className="w-5 h-5 hover:text-gray-700"/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-xs font-bold uppercase mb-1">Project</label><select className="w-full p-2 border rounded" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})} disabled={selectedProjectId !== 'all'}>{projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
                    <div><label className="block text-xs font-bold uppercase mb-1">Title</label><input required className="w-full p-2 border rounded" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold uppercase mb-1">Start</label><input type="datetime-local" required className="w-full p-2 border rounded" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold uppercase mb-1">End</label><input type="datetime-local" required className="w-full p-2 border rounded" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}/></div>
                    </div>
                    <div><label className="block text-xs font-bold uppercase mb-1">Location</label><input className="w-full p-2 border rounded" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}/></div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[var(--color-brand)] text-white rounded hover:opacity-90">{isSubmitting ? 'Saving...' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- CALENDAR PANEL (COMPONENT ĐÃ ĐƯỢC THÊM LẠI) ---
const CalendarPanel = ({ currentMonth, setCurrentMonth, selectedDate, onSelectDate, events, attendance }) => {
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const result = [];
        for (let i = 0; i < firstDay; i++) result.push(null);
        for (let i = 1; i <= days; i++) result.push(new Date(year, month, i));
        return result;
    };

    const days = getDaysInMonth(currentMonth);
    const eventDates = new Set(events.map(e => normalizeDate(e.startTime)));
    const attendanceDates = new Set(attendance.map(a => normalizeDate(a.checkInTime)));

    const handlePrev = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNext = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    const handleToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onSelectDate(today);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col h-full min-h-[600px]">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4 text-gray-800 font-bold text-xl">
                    <button onClick={handlePrev} className="p-1.5 hover:bg-gray-100 rounded-full"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={handleNext} className="p-1.5 hover:bg-gray-100 rounded-full"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
                <button onClick={handleToday} className="px-4 py-1.5 text-sm text-white font-bold rounded-lg shadow-sm hover:opacity-90" style={{ backgroundColor: 'var(--color-brand)' }}>Today</button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center flex-grow content-start">
                {daysOfWeek.map(day => <div key={day} className="text-gray-400 text-xs font-bold uppercase mb-4">{day}</div>)}
                {days.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} />;
                    const dateStr = normalizeDate(date);
                    return (
                        <div key={idx} onClick={() => onSelectDate(date)} className="cursor-pointer h-24">
                            <CalendarDayCell 
                                date={date.getDate()}
                                isSelected={normalizeDate(date) === normalizeDate(selectedDate)}
                                isCheckedIn={attendanceDates.has(dateStr)}
                                hasEvent={eventDates.has(dateStr)} 
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- RIGHT PANEL ---
const RightPanel = ({ selectedDate, dayEvents, myAttendance, onCheckInSuccess, onOpenCreateModal, onEventClick, canCreateMeeting, userRole, onOpenIPModal, onOpenReportModal, showNotification }) => {
    const [checkInStatus, setCheckInStatus] = useState(null); 

    useEffect(() => { setCheckInStatus(null); }, [selectedDate]);

    const isToday = normalizeDate(selectedDate) === normalizeDate(new Date());
    const attendanceRecord = myAttendance.find(a => normalizeDate(a.checkInTime) === normalizeDate(selectedDate));

    const handleCheckIn = async () => {
        setCheckInStatus('loading');
        try {
            const res = await fetch(`${API_BASE_URL}/attendance/checkin`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ note: "Manual" }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed");
            setCheckInStatus('success'); 
            onCheckInSuccess(); 
            showNotification("Checked in successfully!", "success");
        } catch (err) { 
            setCheckInStatus('error'); 
            showNotification(err.message, "error");
        }
    };

    const isAdmin = userRole === 'Admin';
    const isManager = userRole === 'Manager';
    const isMember = userRole === 'Member';

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ClockIcon className="w-6 h-6 text-[var(--color-brand)]"/> Attendance</h2>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{formatDateUS(selectedDate)}</span>
                </div>

                <div className="flex flex-col items-center py-4 min-h-[120px] justify-center">
                    {/* MEMBER: Check-in */}
                    {isMember && (
                        <>
                            {attendanceRecord ? (
                                <div className="text-center animate-fade-in">
                                    <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2"><MapPinIcon className="w-7 h-7" /></div>
                                    <p className="text-gray-600 text-sm font-medium">Checked in at</p>
                                    <p className="text-2xl font-extrabold text-green-600 tracking-tight">{formatTimeUS(attendanceRecord.checkInTime)}</p>
                                </div>
                            ) : isToday ? (
                                <button onClick={handleCheckIn} disabled={checkInStatus === 'loading'} className="px-10 py-3 text-white font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-70 transition-all transform active:scale-95" style={{ backgroundColor: 'var(--color-brand)' }}>
                                    {checkInStatus === 'loading' ? 'Checking...' : 'Check In Now'}
                                </button>
                            ) : <div className="text-center text-gray-400 italic text-sm">No record for this day.</div>}
                        </>
                    )}
                    
                    {/* ADMIN/MANAGER: Actions */}
                    {(isAdmin || isManager) && (
                        <div className="w-full flex gap-4 justify-center px-4">
                            <button onClick={onOpenReportModal} className="flex-1 py-4 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-xl hover:bg-purple-50 hover:text-purple-700 transition border border-gray-200 text-gray-600 shadow-sm hover:shadow-md hover:border-purple-200 group">
                                <UserGroupIcon className="w-7 h-7 group-hover:scale-110 transition-transform"/>
                                <span className="text-sm font-bold">Reports</span>
                            </button>
                            {isAdmin && (
                                <button onClick={onOpenIPModal} className="flex-1 py-4 flex flex-col items-center justify-center gap-2 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition border border-gray-200 text-gray-600 shadow-sm hover:shadow-md hover:border-blue-200 group">
                                    <ShieldCheckIcon className="w-7 h-7 group-hover:scale-110 transition-transform"/>
                                    <span className="text-sm font-bold">Config IPs</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* SCHEDULE LIST */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Events</h2>
                    {canCreateMeeting && <button onClick={onOpenCreateModal} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"><PlusIcon className="w-5 h-5" /></button>}
                </div>
                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {dayEvents.length > 0 ? dayEvents.map(evt => (
                        <div key={evt._id} onClick={() => onEventClick(evt)} className="p-3 bg-gray-50 rounded-lg border-l-4 border-[var(--color-brand)] hover:shadow-md cursor-pointer transition-all">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 text-sm">{evt.title}</h4>
                                <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border">{formatTimeUS(evt.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500"><MapPinIcon className="w-3.5 h-3.5"/><span className="truncate">{evt.location}</span></div>
                        </div>
                    )) : <div className="h-full flex flex-col items-center justify-center text-gray-400"><CalendarIcon className="w-12 h-12 text-gray-200 mb-2 opacity-50" /><p className="text-sm">No events scheduled</p></div>}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const Calendar = () => {
    const { user } = useAuth(); 
    const { dynamicTasksSummary } = useOutletContext();
    const { selectedProjectId, project, currentProjectRole, isLoadingProject } = useProject(); 
    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [projects, setProjects] = useState([]);
    const [allMeetings, setAllMeetings] = useState([]);
    const [myAttendance, setMyAttendance] = useState([]);
    
    const systemRole = user?.role || 'Member';
    const isSystemAdmin = systemRole === 'Admin';
    const projectRole = currentProjectRole || 'Member';
    const effectiveRole = isSystemAdmin ? 'Admin' : projectRole;

    // Notification State
    const [notification, setNotification] = useState({ message: '', type: '' });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isIPModalOpen, setIsIPModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);

    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 3000);
    };

    const fetchData = useCallback(async () => {
        try {
            const [projRes, attRes, meetRes] = await Promise.all([
                fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() }),
                fetch(`${API_BASE_URL}/attendance/me`, { headers: getHeaders() }),
                fetch((selectedProjectId && selectedProjectId !== 'all') 
                    ? `${API_BASE_URL}/projects/${selectedProjectId}/meetings` 
                    : `${API_BASE_URL}/meetings`, { headers: getHeaders() })
            ]);

            const projData = await projRes.json();
            const attData = await attRes.json();
            const meetData = await meetRes.json();

            setProjects(projData.data || []);
            setMyAttendance(attData.data || []);
            setAllMeetings(Array.isArray(meetData.data) ? meetData.data : []);
            setIsLoading(false);
        } catch (error) { 
            console.error(error); 
            setIsLoading(false); 
        }
    }, [selectedProjectId]); 

    useEffect(() => { 
        setIsLoading(true); 
        fetchData(); 
    }, [fetchData]);

    // Debug log
    useEffect(() => {
        console.log(' [Calendar] Role Check:', {
            systemRole,
            isSystemAdmin,
            projectRole,
            effectiveRole,
            selectedProjectId
        });
    }, [systemRole, projectRole, effectiveRole, selectedProjectId]);

    const selectedDayEvents = allMeetings.filter(m => normalizeDate(m.startTime) === normalizeDate(selectedDate));
    const canCreateMeeting = ['Admin', 'Manager'].includes(effectiveRole);
    
    const canDeleteMeeting = (meeting) => {
        if (canCreateMeeting) return true;
        return String(meeting.createdBy?._id || meeting.createdBy) === String(user?._id || user?.id);
    };

    if (isLoading) return <div className="flex-1 p-8 flex items-center justify-center"><LoaderOverlay /></div>;

    return (
        <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen font-sans flex flex-col relative">
            <NotificationBanner message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: '' })} />
            
            <div className="mb-6"><TaskSummary summaryData={dynamicTasksSummary} /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow items-stretch">
                <div className="flex flex-col h-full">
                    <CalendarPanel 
                        currentMonth={currentMonth} 
                        setCurrentMonth={setCurrentMonth} 
                        selectedDate={selectedDate} 
                        onSelectDate={setSelectedDate} 
                        events={allMeetings} 
                        attendance={myAttendance}
                    />
                </div>
                <div className="flex flex-col h-full">
                    <RightPanel 
                        selectedDate={selectedDate} 
                        dayEvents={selectedDayEvents} 
                        myAttendance={myAttendance} 
                        onCheckInSuccess={fetchData} 
                        onOpenCreateModal={() => setIsCreateModalOpen(true)} 
                        onEventClick={setSelectedMeeting} 
                        projects={projects}
                        canCreateMeeting={canCreateMeeting}
                        userRole={effectiveRole}
                        onOpenIPModal={() => setIsIPModalOpen(true)} 
                        onOpenReportModal={() => setIsReportModalOpen(true)}
                        showNotification={showNotification}
                    />
                </div>
            </div>
            
            <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} projects={projects} onSuccess={() => { fetchData(); showNotification("Meeting created", "success"); }} showNotification={showNotification} />
            <MeetingDetailModal isOpen={!!selectedMeeting} onClose={() => setSelectedMeeting(null)} meeting={selectedMeeting} projects={projects} onDeleteSuccess={() => { fetchData(); showNotification("Meeting deleted", "success"); }} canDelete={selectedMeeting ? canDeleteMeeting(selectedMeeting) : false} showNotification={showNotification}/>
            <IPManagementModal isOpen={isIPModalOpen} onClose={() => setIsIPModalOpen(false)} showNotification={showNotification} />
            <AttendanceReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        </div>
    );
};

export default Calendar;