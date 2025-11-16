import React, { useState } from 'react';
import { 
    CalendarIcon, 
    ChevronDownIcon, 
    ClockIcon, 
    BellIcon,
    ArrowPathIcon,
    CheckIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'; 

import { 
    ArrowPathIcon as ProgressSolid, 
    CheckCircleIcon as DoneSolid, 
    ClipboardDocumentListIcon as TotalSolid, 
    ClockIcon as ClockSolid, 
} from '@heroicons/react/24/solid';
import { LoaderOverlay } from '../components/LoaderOverlay';
import { ErrorState } from '../components/ErrorState';
import { mockEventDays, mockCheckedInDays } from '../mocks/events';
import { useOutletContext } from 'react-router-dom';
import TaskSummary from '../components/TaskSummary';
import { CalendarDayCell } from '../components/CalendarDayCell';

const PRIMARY_COLOR = '#f35640'; 

// ---Calendar Panel---
const CalendarPanel = ({ isLoading }) => {
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    // Giả lập lịch tháng 5/2025 
    const dates = [
        null, null, null, null, 1, 2, 3, 
        4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, // 16 là ngày đang chọn
        18, 19, 20, 21, 22, 23, 24,
        25, 26, 27, 28, 29, 30, 31,
    ];
    
    // Dữ liệu tĩnh: Ngày có sự kiện và ngày đã check-in
    const eventsDays = new Set([...mockEventDays, ...mockCheckedInDays]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-grow">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4 text-gray-700 font-semibold">
                    <button className="text-xl text-gray-400 hover:text-gray-700 transition" aria-label="Previous Month">&lt;</button>
                    <span>May 2025</span>
                    <button className="text-xl text-gray-400 hover:text-gray-700 transition" aria-label="Next Month">&gt;</button>
                </div>
                <button 
                    className="px-4 py-1 text-sm text-white font-medium rounded-lg hover:opacity-90 transition duration-150 border-2" 
                    style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, }}
                >
                    Today
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-y-1 text-center text-xs flex-grow">
                {daysOfWeek.map((day) => (
                    <div key={day} className="text-gray-500 font-medium pt-2 pb-1 text-xs md:text-sm">
                        {day}
                    </div>
                ))}
                {dates.map((date, index) => {
                    const isSelected = date === 16; 
                    const isCheckedIn = mockCheckedInDays.includes(date);
                    const hasEvent = eventsDays.has(date);
                    return (
                        // 1. Đổi tên component thành "CalendarDayCell"
                        <CalendarDayCell 
                            key={index}
                            date={date}
                            // 2. Truyền props
                            isSelected={isSelected}
                            isCheckedIn={isCheckedIn}
                            hasEvent={hasEvent}
                        />
                    );
                })} 
            </div>
        </div>
    );
};

// ---Event/Attendance Panel---
const EventPanel = () => {
    // State đơn giản cho UI check-in
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState(null);

    const handleMockCheckIn = () => {
        if (isCheckedIn || isCheckingIn) return;

        setIsCheckingIn(true);
        // Giả lập độ trễ ngắn cho UI
        setTimeout(() => {
            const timeString = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); 
            setCheckInTime(timeString);
            setIsCheckedIn(true);
            setIsCheckingIn(false);
        }, 800);
    };

    let buttonText = "Check in";
    let buttonStyle = { backgroundColor: PRIMARY_COLOR };
    
    if (isCheckingIn) {
        buttonText = "Checking In...";
        buttonStyle = { backgroundColor: '#f97316' }; // Loading (màu cam)
    } else if (isCheckedIn) {
        buttonText = `Checked In (${checkInTime})`;
        buttonStyle = { backgroundColor: '#10b981' }; // Success (màu xanh lá)
    }

    return (
        <div className="space-y-6 flex flex-col flex-grow">
            {/* Attendance Today Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Attendance Today</h2>
                <button 
                    className="w-auto self-start mt-0.2 px-4 py-1.5 text-sm text-white font-medium rounded-lg hover:opacity-90 transition duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleMockCheckIn}
                    disabled={isCheckedIn || isCheckingIn}
                    style={buttonStyle}
                >
                    {buttonText}
                </button>
            </div>

            {/* Events on Specific Day Card */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Events on Friday, May 16, 2025</h2>
                
                <div className="flex flex-col items-center justify-center flex-grow text-center text-gray-500">
                    {/* Calendar Icon */}
                    <div className="mb-4 p-4 bg-gray-100 rounded-full">
                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>No events scheduled for this day</p>
                </div>
            </div>
        </div>
    );
};

// ---Calendar Page Component---
const Calendar = () => {
    const { dynamicTasksSummary } = useOutletContext();
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    React.useEffect(() => {
        setIsLoading(true);
        setIsError(false);
        const timer = setTimeout(() => {
            // Bản thành công 
            setIsLoading(false);

            // Bản lỗi 
            // setIsError(true);
            // setIsLoading(false);

        }, 1500); 
        return () => clearTimeout(timer);
    }, []);

    // 1. Trạng thái Loading
    if (isLoading) {
        return (
            <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans flex items-center justify-center">
                <LoaderOverlay />
            </div>
        );
    }
    
    // 2. Trạng thái Error
    if (isError) {
        return (
            <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans flex items-center justify-center">
                <ErrorState 
                    icon={<ExclamationTriangleIcon className="w-12 h-12 text-red-400" />}
                    title="Could not load calendar"
                    message="An error occurred while fetching data. Please try again later."
                />
            </div>
        );
    }

    // 3. Trạng thái thành công (hiển thị nội dung)
    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen font-sans">
            <TaskSummary summaryData={dynamicTasksSummary} />
            {/* Main Content: Calendar and Events  */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch min-h-[550px]">
                {/* Cột Trái: Calendar Panel */}
                <div className="md:col-span-1 flex flex-col flex-grow"> 
                    <CalendarPanel 
                        checkedInDaysList={mockCheckedInDays} 
                        isLoading={false} 
                    />
                </div>
                {/* Cột Phải: Event Panel  */}
                <div className="md:col-span-2 flex flex-col flex-grow">
                    <EventPanel />
                </div>
            </div>
        </div>
    );
}

export default Calendar;
