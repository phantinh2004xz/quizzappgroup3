import React, { useState } from 'react';
import { AcademicCapIcon, ChartBarIcon, ChevronLeftIcon, ChevronRightIcon, CubeTransparentIcon } from '../../left-bar/icons';

const tabs = [
  { id: 'tests', label: 'Bài thi của tôi', icon: AcademicCapIcon },
  { id: 'results', label: 'Lịch sử bài thi', icon: ChartBarIcon },
];

const UserCourseSidebar = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const handleGoHome = () => {
    window.location.href = '/user';
  };
  return (
    <aside className={`sidebar-transition bg-white border-r shadow-lg min-h-screen flex flex-col ${isExpanded ? 'w-64 p-6' : 'w-20 p-3 items-center'} transition-all duration-300`}>
      {/* Header với nút về trang chủ và toggle */}
      <div className={`flex items-center w-full mb-6 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoHome}
            aria-label="Về trang chủ"
            className="p-1.5 rounded-full text-sky-600 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 relative group"
          >
            <CubeTransparentIcon className="w-7 h-7" />
            {!isExpanded && (
              <span className="absolute left-full ml-2 px-2 py-1 text-xs font-medium text-white bg-slate-800/95 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">Trang chủ</span>
            )}
          </button>
          {isExpanded && <h2 className="text-xl font-bold text-slate-800 tracking-tight">Khóa học</h2>}
        </div>
        <button
          onClick={() => setIsExpanded(exp => !exp)}
          aria-label={isExpanded ? 'Thu gọn thanh bên' : 'Mở rộng thanh bên'}
          className="p-1.5 rounded-full text-slate-400 hover:bg-slate-200 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {isExpanded ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>
      </div>
      <nav className="flex flex-col gap-2 w-full">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-semibold transition-colors text-base w-full
                ${isActive ? 'bg-sky-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-sky-100'}
                ${!isExpanded ? 'justify-center px-2' : ''}
              `}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-sky-600'}`} />
              {isExpanded && <span>{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default UserCourseSidebar;