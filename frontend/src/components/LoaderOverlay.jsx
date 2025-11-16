import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export function LoaderOverlay() {
  return (
    // Thêm min-h để đảm bảo nó chiếm không gian và căn giữa
    <div className="flex flex-col items-center justify-center w-full min-h-[300px] text-gray-500">
      <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
      <p className="mt-3 text-sm font-medium">Loading data...</p>
    </div>
  );
}

export default LoaderOverlay;