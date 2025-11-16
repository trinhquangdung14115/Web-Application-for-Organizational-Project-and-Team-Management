import React from 'react';

const PRIMARY_COLOR = '#f35640'; 

export const CalendarDayCell = ({ date, isSelected, isCheckedIn, hasEvent }) => {
    // Nếu không có ngày (ô trống), render một ô trống
    if (!date) {
        return <div className="p-1"></div>;
    }

    // --- Logic style ---
    //
    let dayClasses = `p-1 flex flex-col items-center justify-center text-sm relative transition-all duration-150 rounded-full w-8 h-8 self-center mx-auto cursor-pointer`;

    if (isSelected) {
        // Ngày đang chọn
        dayClasses += ` text-white font-semibold`;
        dayClasses += ` rounded-lg shadow-lg`; 
        dayClasses = dayClasses.replace("bg-red-600", ""); 
    } else {
        // Ngày bình thường
        dayClasses += ` text-gray-800 hover:bg-gray-100`;
        if (isCheckedIn) {
            dayClasses += ` text-blue-600 font-medium`; // Ngày đã check-in màu xanh
        }
    }

    return (
        <div className="p-0.5">
            <div 
                className={dayClasses}
                style={isSelected ? { backgroundColor: PRIMARY_COLOR } : {}}
            >
                <div className={isSelected ? 'relative top-[1px]' : ''}>
                    {date}
                </div>
                {/* Dấu chấm sự kiện */}
                {/* */}
                {hasEvent && !isCheckedIn && !isSelected && ( 
                    <div className="w-1 h-1 bg-gray-400 rounded-full mt-1 absolute bottom-1"></div>
                )}
            </div>
        </div>
    );
};

export default CalendarDayCell;