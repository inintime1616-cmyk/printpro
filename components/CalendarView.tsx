import React, { useState } from 'react';
import { Project } from '../types';
import { getTagColorClass } from '../utils';
import { ChevronLeft, ChevronRight, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CalendarViewProps {
  projects: Project[];
  onEdit: (p: Project) => void;
  tagColors: Record<string, string>;
}

// Define specific event types for rendering
type CalendarEventType = 'stage' | 'deadline';

interface CalendarEvent {
  id: string; // Composite ID
  date: string;
  type: CalendarEventType;
  title: string; // Stage Name or Project Name
  subtitle?: string; // Project Name (if type is stage)
  project: Project;
  tag?: string; // For coloring stages
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

  // Logic to generate all events for the month
  const getEventsForDate = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events: CalendarEvent[] = [];

    projects.filter(p => !p.archived).forEach(p => {
        // 1. Check Project Deadline (Type: deadline)
        if (p.deadline === dateStr) {
            events.push({
                id: `proj-${p.id}`,
                date: dateStr,
                type: 'deadline',
                title: p.name,
                project: p
            });
        }

        // 2. Check Stage Deadlines (Type: stage)
        p.stages?.forEach((s, idx) => {
            if (!s.completed && s.deadline === dateStr) {
                events.push({
                    id: `stage-${p.id}-${idx}`,
                    date: dateStr,
                    type: 'stage',
                    title: s.name,
                    subtitle: p.name,
                    project: p,
                    tag: s.tag
                });
            }
        });
    });

    return events;
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
          {blanks.map(n => <div key={`empty-${n}`} className="bg-[#fcfaf8] h-32 md:h-40" />)}
          
          {days.map(day => {
            const dayEvents = getEventsForDate(day);
            const today = isToday(day);
            return (
              <div key={day} className={`bg-white h-32 md:h-40 p-1.5 transition group flex flex-col hover:bg-[#faf9f6]`}>
                <div className={`text-xs font-bold mb-1.5 pl-1 flex items-center justify-between ${today ? 'text-red-800' : 'text-stone-400'}`}>
                  <span className={today ? 'w-6 h-6 flex items-center justify-center bg-red-800 text-white rounded-full' : ''}>{day}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-0.5">
                  {dayEvents.map(event => {
                    const isStage = event.type === 'stage';
                    
                    if (isStage) {
                        // Colored Stage Event
                        const colorClass = event.tag ? getTagColorClass(event.tag, tagColors) : 'bg-stone-100 text-stone-600 border-stone-200';
                        return (
                            <div 
                                key={event.id}
                                onClick={() => onEdit(event.project)}
                                className={`rounded px-2 py-1.5 cursor-pointer shadow-sm hover:brightness-95 transition flex flex-col border ${colorClass}`}
                            >
                                <span className="text-[12px] font-bold leading-tight truncate">{event.title}</span>
                                <span className="text-[10px] opacity-80 truncate leading-tight mt-0.5">{event.subtitle}</span>
                            </div>
                        );
                    } else {
                        // Neutral Deadline Event - Japanese Minimalist Style
                        return (
                            <div 
                                key={event.id}
                                onClick={() => onEdit(event.project)}
                                className="group/evt rounded px-2 py-1.5 cursor-pointer bg-white border border-stone-200 hover:border-stone-400 text-stone-600 hover:text-stone-800 transition flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            >
                                <Hexagon size={10} className="shrink-0 text-stone-300 group-hover/evt:text-stone-500 transition-colors" strokeWidth={2.5} />
                                <span className="text-[11px] font-medium truncate leading-tight tracking-wide font-serif">{event.title}</span>
                            </div>
                        );
                    }
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-center gap-6 mt-4 text-[13px] text-stone-500 font-light">
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-stone-200"></div>
            <span>階段排程 (依標籤顯示顏色)</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-3 h-3 flex items-center justify-center"><Hexagon size={10} className="text-stone-400" strokeWidth={2.5} /></div>
            <span>專案總截止日</span>
         </div>
      </div>
    </motion.div>
  );
};

export default CalendarView;