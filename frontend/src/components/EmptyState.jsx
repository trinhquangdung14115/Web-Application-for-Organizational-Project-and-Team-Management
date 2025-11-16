import React from 'react';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export function EmptyState({ icon, title, message, children }) {
  // Icon mặc định nếu không được truyền vào
  const defaultIcon = <ClipboardDocumentListIcon className="w-12 h-12 text-gray-400" />;

  return (
    // Tự căn giữa và chiếm không gian
    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[300px]">
      <div className="text-gray-400">
         {icon || defaultIcon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-800">
        {title || "No items found"}
      </h3>
      <p className="mt-2 text-sm text-gray-500 max-w-xs">
        {message || "There is no data to display at the moment."}
      </p>
      {/* 'children' dùng để truyền vào một nút bấm, ví dụ 'Tạo Task mới' */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
}

export default EmptyState;