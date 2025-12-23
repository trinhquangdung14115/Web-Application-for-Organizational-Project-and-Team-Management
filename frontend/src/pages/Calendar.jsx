import React, { useState, useEffect, useCallback } from 'react';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ClockIcon, 
    MapPinIcon,
    PlusIcon,
    XMarkIcon,
    VideoCameraIcon,
    CalendarIcon,
    Bars3BottomLeftIcon,
    BriefcaseIcon
} from '@heroicons/react/24/outline'; 
import { useOutletContext } from 'react-router-dom';

// ===> IMPORT CONTEXT <===
import { useProject } from '../context/ProjectContext'; 

import { LoaderOverlay } from '../components/LoaderOverlay';
import TaskSummary from '../components/TaskSummary'; 
import { CalendarDayCell } from '../components/CalendarDayCell';

const API_BASE_URL = 'http://localhost:4000/api';

// --- HELPER FUNCTIONS ---
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('accessToken')}`
});

const normalizeDate = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatTimeUS = (dateInput) => {
    if (!dateInput) return '';
    return new Date(dateInput).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDateUS = (dateInput) => {
    if (!dateInput) return '';
    return new Date(dateInput).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};


// --- MODAL XEM CHI TIẾT MEETING ---
const MeetingDetailModal = ({ isOpen, onClose, meeting, projects }) => {
    if (!isOpen || !meeting) return null;
    const projectName = projects.find(p => p._id === meeting.projectId)?.name || 'Unknown Project';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{meeting.title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><XMarkIcon className="w-6 h-6 text-gray-500"/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 p-2 rounded-lg">
                        <BriefcaseIcon className="w-5 h-5 text-[var(--color-brand)]" />
                        <span className="text-sm font-bold text-gray-800">{projectName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                        <ClockIcon className="w-5 h-5 text-gray-500" />
                        <div>
                            <p className="text-sm font-semibold">{formatDateUS(meeting.startTime)}</p>
                            <p className="text-sm text-gray-500">
                                {formatTimeUS(meeting.startTime)} - {formatTimeUS(meeting.endTime)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                        {meeting.location?.includes('http') ? <VideoCameraIcon className="w-5 h-5 text-blue-500"/> : <MapPinIcon className="w-5 h-5 text-red-500"/>}
                        <span className="text-sm font-medium break-all">{meeting.location || 'No location provided'}</span>
                    </div>
                    {meeting.description && (
                        <div className="flex gap-3 text-gray-700 border-t border-gray-100 pt-3">
                            <Bars3BottomLeftIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <p className="text-sm text-gray-600 leading-relaxed">{meeting.description}</p>
                        </div>
                    )}
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition">Close</button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL TẠO MEETING ---
const CreateMeetingModal = ({ isOpen, onClose, projects, onSuccess }) => {
    // Lấy context để tự động chọn project mặc định
    const { selectedProjectId } = useProject();
    
    const [formData, setFormData] = useState({
        title: '', projectId: '', startTime: '', endTime: '', location: '', description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setErrorMsg('');
            // Logic chọn project mặc định:
            // 1. Nếu đang chọn project cụ thể ở Sidebar -> Lấy project đó
            // 2. Nếu đang chọn "All Projects" -> Lấy project đầu tiên trong list
            let defaultProjId = '';
            if (selectedProjectId && selectedProjectId !== 'all') {
                defaultProjId = selectedProjectId;
            } else if (projects.length > 0) {
                defaultProjId = projects[0]._id;
            }
            
            setFormData(prev => ({ ...prev, projectId: defaultProjId }));
        }
    }, [isOpen, projects, selectedProjectId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${formData.projectId}/meetings`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create meeting");

            onSuccess(); 
            onClose();
            setFormData(prev => ({ ...prev, title: '', location: '', description: '' }));
        } catch (error) { setErrorMsg(error.message); } 
        finally { setIsSubmitting(false); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Schedule New Meeting</h3>
                    <button onClick={onClose}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-brand)] outline-none" 
                            value={formData.projectId} 
                            onChange={e => setFormData({...formData, projectId: e.target.value})} 
                            required
                            disabled={selectedProjectId !== 'all'} // Disable nếu đang ở view project cụ thể để tránh tạo nhầm
                        >
                            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meeting Title</label><input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-brand)] outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Weekly Sync"/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Start Time</label><input type="datetime-local" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})}/></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">End Time</label><input type="datetime-local" required className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})}/></div>
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location / Link</label><input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Meeting Room or Zoom URL"/></div>
                    {errorMsg && <p className="text-red-500 text-sm font-medium text-center">{errorMsg}</p>}
                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 text-white rounded-lg font-bold shadow-md hover:opacity-90 disabled:opacity-50 text-sm" style={{ backgroundColor: 'var(--color-brand)' }}>{isSubmitting ? 'Creating...' : 'Create Meeting'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- CALENDAR PANEL ---
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
                    const isCheckedIn = attendanceDates.has(dateStr);

                    return (
                        <div key={idx} onClick={() => onSelectDate(date)} className="cursor-pointer h-24">
                            <CalendarDayCell 
                                date={date.getDate()}
                                isSelected={normalizeDate(date) === normalizeDate(selectedDate)}
                                isCheckedIn={isCheckedIn}
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
const RightPanel = ({ selectedDate, dayEvents, myAttendance, onCheckInSuccess, onOpenCreateModal, onEventClick, canCreateMeeting }) => {
    const [checkInStatus, setCheckInStatus] = useState(null); 
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setMsg(''); setError(''); setCheckInStatus(null);
    }, [selectedDate]);

    const selectedDateKey = normalizeDate(selectedDate);
    const attendanceRecord = myAttendance.find(a => normalizeDate(a.checkInTime) === selectedDateKey);
    const isToday = selectedDateKey === normalizeDate(new Date());

    const handleCheckIn = async () => {
        setCheckInStatus('loading');
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/attendance/checkin`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ note: "Manual check-in" })
            });
            const data = await res.json();
            
            if (!res.ok) {
                if (res.status === 409) { onCheckInSuccess(); } 
                else { throw new Error(data.message); }
            } else {
                setCheckInStatus('success');
                onCheckInSuccess(); 
            }
        } catch (error) {
            setCheckInStatus('error');
            setError(error.message || "Connection error.");
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* CHECK-IN CARD */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <ClockIcon className="w-6 h-6 text-[var(--color-brand)]"/> Attendance
                    </h2>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{formatDateUS(selectedDate)}</span>
                </div>

                <div className="flex flex-col items-center py-4">
                    {attendanceRecord ? (
                         <div className="text-center animate-fade-in">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <MapPinIcon className="w-8 h-8" />
                            </div>
                            <p className="text-gray-600 text-sm">Checked in at</p>
                            <p className="text-2xl font-bold text-green-600">{formatTimeUS(attendanceRecord.checkInTime)}</p>
                         </div>
                    ) : isToday ? (
                        <>
                            <button onClick={handleCheckIn} disabled={checkInStatus === 'loading'} className="px-8 py-3 bg-[var(--color-brand)] text-white font-bold rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-70" style={{ backgroundColor: 'var(--color-brand)' }}>
                                {checkInStatus === 'loading' ? 'Processing...' : 'Check In Now'}
                            </button>
                            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                        </>
                    ) : (
                        <div className="text-center text-gray-400"><p className="text-sm">No attendance record.</p></div>
                    )}
                </div>
            </div>
            
            {/* SCHEDULE LIST */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Events</h2>

                    {/* CHỈ HIỆN NÚT NẾU CÓ QUYỀN TẠO MEETING (Admin/Manager) */}
                    {canCreateMeeting && (
                        <button onClick={onOpenCreateModal} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors" title="Create Meeting"><PlusIcon className="w-5 h-5" /></button>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {dayEvents.length > 0 ? dayEvents.map(evt => (
                        <div key={evt._id} onClick={() => onEventClick(evt)} className="p-3 bg-gray-50 rounded-lg border-l-4 border-[var(--color-brand)] group hover:shadow-md transition-all cursor-pointer">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 text-sm group-hover:text-[var(--color-brand)] transition-colors">{evt.title}</h4>
                                <span className="text-xs font-mono text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">{formatTimeUS(evt.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                {evt.location?.includes('http') ? <VideoCameraIcon className="w-3.5 h-3.5"/> : <MapPinIcon className="w-3.5 h-3.5"/>}
                                <span className="truncate max-w-[200px]">{evt.location || 'No location'}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <CalendarIcon className="w-12 h-12 text-gray-200 mb-2" />
                            <p className="text-sm">No meetings scheduled</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const Calendar = () => {
    const { dynamicTasksSummary } = useOutletContext();
    
    // ===> SỬ DỤNG CONTEXT PROJECT <===
    const { selectedProjectId } = useProject(); 

    const [isLoading, setIsLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [projects, setProjects] = useState([]);
    const [allMeetings, setAllMeetings] = useState([]);
    const [myAttendance, setMyAttendance] = useState([]);
    const [userRole, setUserRole] = useState('Member'); 
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
            }

            // 1. Fetch List Projects (Để nạp vào dropdown modal create)
            const projRes = await fetch(`${API_BASE_URL}/projects`, { headers: getHeaders() });
            const projData = await projRes.json();
            const projectList = projData.data || [];
            setProjects(projectList);

            // 2. Fetch Attendance (Cá nhân, không phụ thuộc project)
            const attRes = await fetch(`${API_BASE_URL}/attendance/me`, { headers: getHeaders() });
            const attData = await attRes.json();
            setMyAttendance(attData.data || []);

            // 3. ===> FETCH MEETINGS THEO CONTEXT <===
            let meetingsUrl = `${API_BASE_URL}/meetings`; // Mặc định: Lấy hết
            
            if (selectedProjectId && selectedProjectId !== 'all') {
                meetingsUrl = `${API_BASE_URL}/projects/${selectedProjectId}/meetings`;
            }

            const meetingRes = await fetch(meetingsUrl, { headers: getHeaders() });
            const meetingData = await meetingRes.json();
            
            // Xử lý dữ liệu trả về (Data có thể là mảng trực tiếp hoặc nằm trong field data)
            let meetings = meetingData.data || [];
            if (!Array.isArray(meetings) && Array.isArray(meetingData)) {
                meetings = meetingData;
            }
            
            setAllMeetings(meetings);
            setIsLoading(false);
        } catch (error) { 
            console.error("Fetch error:", error); 
            setIsLoading(false); 
        }
    }, [selectedProjectId]); // <--- Rerun khi đổi dự án

    useEffect(() => { 
        setIsLoading(true);
        fetchData(); 
    }, [fetchData]);

    const selectedDayEvents = allMeetings.filter(m => normalizeDate(m.startTime) === normalizeDate(selectedDate));
    
    // Check quyền tạo meeting (Admin/Manager)
    const canCreateMeeting = ['Admin', 'Manager'].includes(userRole);

    if (isLoading) return <div className="flex-1 p-8 flex items-center justify-center"><LoaderOverlay /></div>;

    return (
        <div className="flex-1 p-6 md:p-8 bg-gray-50 min-h-screen font-sans flex flex-col">
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
                        onEventClick={(evt) => setSelectedMeeting(evt)}
                        projects={projects}
                        canCreateMeeting={canCreateMeeting}
                    />
                </div>
            </div>
            <CreateMeetingModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} projects={projects} onSuccess={fetchData} />
            <MeetingDetailModal isOpen={!!selectedMeeting} onClose={() => setSelectedMeeting(null)} meeting={selectedMeeting} projects={projects} />
        </div>
    );
};

export default Calendar;