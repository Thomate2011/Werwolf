import React from 'react';
import { useViewMode } from '../ViewModeContext';

const ViewModeToggle: React.FC = () => {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <button
      onClick={toggleViewMode}
      className="p-2 hover:bg-gray-100 rounded-full transition"
      title={viewMode === 'mobile' ? 'Zur Desktop-Ansicht wechseln' : 'Zur Mobile-Ansicht wechseln'}
    >
      {viewMode === 'mobile' ? (
        // Desktop Icon
        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
          <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" />
          <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" />
        </svg>
      ) : (
        // Mobile Icon
        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth="2" />
          <line x1="12" y1="18" x2="12" y2="18" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
};

export default ViewModeToggle;