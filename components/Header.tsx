import React from 'react';
import { ViewType } from '../types';
import { Printer, Layers, CalendarDays, Hammer, Archive, Plus, Feather, Download, Upload, NotebookPen } from 'lucide-react';

interface HeaderProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
  onNewProject: () => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  onChangeView, 
  onNewProject, 
  title, 
  onTitleChange,
  onExport,
  onImport
}) => {
  const navItems: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '進行中', icon: <Layers size={16} /> },
    { id: 'memo', label: '備忘錄', icon: <NotebookPen size={16} /> },
    { id: 'calendar', label: '行事曆', icon: <CalendarDays size={16} /> },
    { id: 'workspace', label: '工藝區', icon: <Hammer size={16} /> },
    { id: 'archived', label: '歸檔庫', icon: <Archive size={16} /> },
  ];

  return (
    <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white/80 p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-stone-100 gap-4 sticky top-4 z-40 backdrop-blur-md">
      <h1 className="text-2xl font-bold text-stone-800 flex items-center tracking-wide font-serif">
        <span className="bg-red-800 text-white w-10 h-10 flex items-center justify-center rounded-lg mr-3 shadow-lg shadow-red-100 shrink-0">
          <Printer size={20} />
        </span>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-transparent border-b-2 border-transparent hover:border-stone-200 focus:border-red-800 outline-none text-stone-800 font-serif transition-colors w-48 md:w-64 placeholder-stone-300"
          placeholder="輸入系統名稱"
        />
      </h1>
      
      <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
        <div className="flex bg-stone-100/50 p-1.5 rounded-xl border border-stone-100">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
                ${currentView === item.id 
                  ? 'bg-white text-red-800 shadow-sm ring-1 ring-stone-100' 
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="w-px h-8 bg-stone-200 mx-2 hidden md:block"></div>

        {/* Data Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={onExport} 
            className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition" 
            title="匯出備份資料"
          >
            <Download size={18} />
          </button>
          <label 
            className="p-2.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition cursor-pointer" 
            title="匯入備份資料"
          >
            <Upload size={18} />
            <input 
              type="file" 
              accept=".json" 
              onChange={onImport} 
              className="hidden" 
              value=""
            />
          </label>
        </div>

        <button 
          onClick={onNewProject} 
          className="whitespace-nowrap bg-red-800 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-red-900 transition-all shadow-md shadow-red-100 hover:shadow-lg flex items-center gap-2 ml-auto md:ml-0 group"
        >
          <Feather size={16} className="group-hover:rotate-45 transition-transform duration-300" />
          <span>立案</span>
        </button>
      </div>
    </header>
  );
};

export default Header;