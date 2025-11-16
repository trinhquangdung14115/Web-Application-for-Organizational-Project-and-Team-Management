import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom'; 

export default function NotificationBell({ notificationCount }) {
    
    const count = notificationCount || 0;
    const displayCount = count > 9 ? '9+' : count;

    return (
        <Link to="/notifications" className="relative cursor-pointer p-1">
            <BellIcon className="w-6 h-6 text-gray-700 hover:text-blue-600 transition-colors" />
            
            {count > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white transform scale-90">
                    {displayCount}
                </div>
            )}
        </Link>
    );
}