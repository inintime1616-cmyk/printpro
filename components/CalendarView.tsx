import React, { useState } from 'react';
import { Project } from '../types';
import { getProjectStatus, getTagColorClass } from '../utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarViewProps {
  projects: Project[];
  onEdit: (p: Project) => void;
  tagColors: Record<string, string>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ projects, onEdit, tagColors }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const changeMonth = (delta: number) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const getProjectDisplayDate = (p: Project): string => {
    // 1. Priority: Current active stage (first incomplete stage with a deadline)
    const activeStage = p.stages?.find(s => !s.completed && s.deadline);
    if (activeStage) {
      return activeStage.deadline;
    }
    // 2. Fallback: Project deadline (if all stages complete or no stages/deadlines)
    return p.deadline;
  };

  const getProjectsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return projects.filter(p => !p.archived && getProjectDisplayDate(p) === dateStr);
  };

  const getProjectStyle = (p: Project) => {
    // Use the first tag color if available, otherwise default
    if (p.tags.length > 0) {
        return `${getTagColorClass(p.tags[0], tagColors)} hover:brightness-95`;
    }
    return 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200';
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl shadow-sm border border-stone-100">
        <button onClick={() => changeMonth(-1)} className="flex items-center text-stone-500 hover:bg-stone-50 px-3 py-1.5 rounded-lg transition text-[13.5px]">
          <ChevronLeft size={18} className="mr-1" /> 上個月
        </button>
        <h2 className="text-xl font-bold text-stone-800 tabular-nums font-serif tracking-widest">{year} 年 {month + 1} 月</h2>
        <button onClick={() => changeMonth(1)} className="flex items-center text-stone-500 hover:bg-stone-50 px-3 py-1.5 rounded-lg transition text-[13.5px]">
          下個月 <ChevronRight size={18} className="ml-1" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="grid grid-cols-7 text-center border-b border-stone-200 bg-stone-50">
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
            <div key={d} className={`py-4 font-bold text-[13.5px] ${i === 0 || i === 6 ? 'text-red-800' : 'text-stone-600'}`}>{d}</div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 bg-stone-200 gap-px border-b border-stone-200">
          {blanks.map(n => <div key={`empty-${n}`} className="bg-[#fcfaf8] h-32" />)}
          
          {days.map(day => {
            const dayProjects = getProjectsForDate(day);
            const today = isToday(day);
            return (
              <div key={day} className={`bg-white h-32 p-1.5 transition group flex flex-col hover:bg-[#faf9f6]`}>
                <div className={`text-xs font-bold mb-2 pl-1 flex items-center justify-between ${today ? 'text-red-800' : 'text-stone-400'}`}>
                  <span className={today ? 'w-6 h-6 flex items-center justify-center bg-red-800 text-white rounded-full' : ''}>{day}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                  {dayProjects.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => onEdit(p)}
                      className={`text-[13.5px] p-1.5 rounded cursor-pointer truncate font-medium transition shadow-sm ${getProjectStyle(p)}`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="text-center text-stone-400 text-[13.5px] font-light">
        提示：月曆僅顯示「進行中」的專案。日期位置以目前進行中的階段截止日為準，若無階段則以總截止日為準。
      </div>
    </motion.div>
  );
};

export default CalendarView;