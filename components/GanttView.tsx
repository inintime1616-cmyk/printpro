import React, { useState, useMemo } from 'react';
import { Project, CraftSchedule } from '../types';
import { getTagColorClass, getDiffDays } from '../utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Plus, 
  Search, 
  Clock, 
  ExternalLink, 
  Trash2, 
  X,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GanttViewProps {
  projects: Project[];
  craftSchedules: CraftSchedule[];
  availableCrafts: string[];
  tagColors: Record<string, string>;
  onAddSchedule: (schedule: Omit<CraftSchedule, 'id' | 'createdAt'>) => void;
  onUpdateSchedule: (schedule: CraftSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onAddCraft: (craftName: string) => void;
  onDeleteCraft: (craftName: string) => void;
  onEditProject: (project: Project) => void;
}

const WEEKDAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

// Helper to convert date string "YYYY-MM-DD" to Date object at local midnight
const parseLocalDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Helper to format Date object to "YYYY-MM-DD"
const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
}

interface WeekRow {
  weekIndex: number;
  days: CalendarDay[];
}

interface ScheduleSegment {
  schedule: CraftSchedule;
  startCol: number; // 0 to 6
  endCol: number;   // 0 to 6
  isStartActual: boolean;
  isEndActual: boolean;
  totalDays: number;
}

const GanttView: React.FC<GanttViewProps> = ({
  projects,
  craftSchedules,
  availableCrafts,
  tagColors,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddCraft,
  onDeleteCraft,
  onEditProject
}) => {
  const activeProjects = useMemo(() => projects.filter(p => !p.archived), [projects]);

  // View state
  const [selectedCraft, setSelectedCraft] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState<CraftSchedule | null>(null);
  const [isAddCraftModalOpen, setIsAddCraftModalOpen] = useState(false);
  const [newCraftName, setNewCraftName] = useState('');

  // Form state for Assign Modal
  const [assignCraft, setAssignCraft] = useState<string>('');
  const [assignProjectId, setAssignProjectId] = useState<number | null>(null);
  const [assignStartDate, setAssignStartDate] = useState<string>('');
  const [assignEndDate, setAssignEndDate] = useState<string>('');
  const [assignPriority, setAssignPriority] = useState<'高' | '中' | '低'>('中');
  const [assignNotes, setAssignNotes] = useState<string>('');

  // Form state for Edit Detail Modal
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editPriority, setEditPriority] = useState<'高' | '中' | '低'>('中');
  const [editNotes, setEditNotes] = useState<string>('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const todayStr = useMemo(() => {
    return formatLocalDate(new Date());
  }, []);

  // Generate 7-column calendar grid grouped by weeks
  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i);
      const dateStr = formatLocalDate(prevDate);
      days.push({
        date: prevDate,
        dateStr,
        dayNumber: prevDate.getDate(),
        isCurrentMonth: false,
        isWeekend: prevDate.getDay() === 0 || prevDate.getDay() === 6,
        isToday: dateStr === todayStr
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const thisDate = new Date(currentYear, currentMonth, d);
      const dateStr = formatLocalDate(thisDate);
      days.push({
        date: thisDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isWeekend: thisDate.getDay() === 0 || thisDate.getDay() === 6,
        isToday: dateStr === todayStr
      });
    }

    // Trailing days from next month to make complete 7-day weeks (either 35 or 42 cells)
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let nextD = 1; nextD <= remainingDays; nextD++) {
        const nextDate = new Date(currentYear, currentMonth + 1, nextD);
        const dateStr = formatLocalDate(nextDate);
        days.push({
          date: nextDate,
          dateStr,
          dayNumber: nextD,
          isCurrentMonth: false,
          isWeekend: nextDate.getDay() === 0 || nextDate.getDay() === 6,
          isToday: dateStr === todayStr
        });
      }
    }

    // Split into weeks (chunks of 7)
    const weeks: WeekRow[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push({
        weekIndex: Math.floor(i / 7),
        days: days.slice(i, i + 7)
      });
    }

    return weeks;
  }, [currentYear, currentMonth, todayStr]);

  // All distinct crafts list
  const allCraftsList = useMemo(() => {
    return Array.from(new Set(availableCrafts)).filter(Boolean);
  }, [availableCrafts]);

  // Filtered schedules based on craft and search query
  const filteredSchedules = useMemo(() => {
    return craftSchedules.filter(schedule => {
      // Craft filter
      if (selectedCraft !== 'all' && schedule.craftName !== selectedCraft) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const project = projects.find(p => p.id === schedule.projectId);
        const matchProject = project && project.name.toLowerCase().includes(q);
        const matchCraft = schedule.craftName.toLowerCase().includes(q);
        const matchNotes = schedule.notes && schedule.notes.toLowerCase().includes(q);
        if (!matchProject && !matchCraft && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [craftSchedules, selectedCraft, searchQuery, projects]);

  // Pre-calculate active project count per date string across filteredSchedules
  const projectCountPerDate = useMemo(() => {
    const map = new Map<string, number>();
    filteredSchedules.forEach(s => {
      const start = parseLocalDate(s.startDate);
      const end = parseLocalDate(s.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        const dStr = formatLocalDate(cur);
        map.set(dStr, (map.get(dStr) || 0) + 1);
        cur.setDate(cur.getDate() + 1);
      }
    });
    return map;
  }, [filteredSchedules]);

  // Compute segments of schedules per week
  const getSegmentsForWeek = (week: WeekRow): ScheduleSegment[] => {
    const weekStartDateStr = week.days[0].dateStr;
    const weekEndDateStr = week.days[6].dateStr;

    const segments: ScheduleSegment[] = [];

    filteredSchedules.forEach(schedule => {
      // Check if schedule overlaps with this week
      if (schedule.endDate < weekStartDateStr || schedule.startDate > weekEndDateStr) {
        return;
      }

      // Determine start column in this week (0..6)
      let startCol = 0;
      let isStartActual = false;
      if (schedule.startDate >= weekStartDateStr) {
        const foundIdx = week.days.findIndex(d => d.dateStr === schedule.startDate);
        startCol = foundIdx !== -1 ? foundIdx : 0;
        isStartActual = true;
      }

      // Determine end column in this week (0..6)
      let endCol = 6;
      let isEndActual = false;
      if (schedule.endDate <= weekEndDateStr) {
        const foundIdx = week.days.findIndex(d => d.dateStr === schedule.endDate);
        endCol = foundIdx !== -1 ? foundIdx : 6;
        isEndActual = true;
      }

      const startD = parseLocalDate(schedule.startDate);
      const endD = parseLocalDate(schedule.endDate);
      const totalDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);

      segments.push({
        schedule,
        startCol,
        endCol,
        isStartActual,
        isEndActual,
        totalDays
      });
    });

    // 優先度數值權重 (高: 3, 中: 2, 低: 1)
    const priorityWeight = (p?: '高' | '中' | '低') => {
      if (p === '高') return 3;
      if (p === '中') return 2;
      if (p === '低') return 1;
      return 2; // 未設定預設為中
    };

    // 排序條件：
    // 條件 1: 起始日期越早越上面 (schedule.startDate)
    // 條件 2: 緊急度越高越上面 (高 > 中 > 低)
    // 條件 1 重要於條件 2
    return segments.sort((a, b) => {
      if (a.schedule.startDate !== b.schedule.startDate) {
        return a.schedule.startDate.localeCompare(b.schedule.startDate);
      }
      const pA = priorityWeight(a.schedule.priority);
      const pB = priorityWeight(b.schedule.priority);
      if (pA !== pB) {
        return pB - pA; // 緊急度高的排前面（上方）
      }
      return a.schedule.endDate.localeCompare(b.schedule.endDate);
    });
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
  };

  // Open Assign Modal
  const openAssignModal = (preselectedCraft?: string) => {
    const targetCraft = preselectedCraft || (selectedCraft !== 'all' ? selectedCraft : allCraftsList[0] || '數位印刷');
    setAssignCraft(targetCraft);
    setAssignProjectId(activeProjects[0]?.id || null);
    
    // Default dates
    const start = todayStr;
    const defaultEnd = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
    setAssignStartDate(start);
    setAssignEndDate(defaultEnd);
    setAssignPriority('中');
    setAssignNotes('');
    setIsAssignModalOpen(true);
  };

  // Submit Assign Modal
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectId || !assignCraft.trim() || !assignStartDate || !assignEndDate) {
      alert('請填寫完整排程資訊並選擇專案！');
      return;
    }

    if (assignStartDate > assignEndDate) {
      alert('排程開始日期不能晚於結束日期！');
      return;
    }

    onAddSchedule({
      craftName: assignCraft.trim(),
      projectId: assignProjectId,
      startDate: assignStartDate,
      endDate: assignEndDate,
      priority: assignPriority,
      notes: assignNotes.trim() || undefined
    });

    setIsAssignModalOpen(false);
  };

  // Open Detail / Edit Modal
  const handleOpenDetail = (schedule: CraftSchedule) => {
    setSelectedScheduleForDetail(schedule);
    setEditStartDate(schedule.startDate);
    setEditEndDate(schedule.endDate);
    setEditPriority(schedule.priority || '中');
    setEditNotes(schedule.notes || '');
  };

  // Save Schedule Edits
  const handleSaveScheduleEdit = () => {
    if (!selectedScheduleForDetail) return;
    if (editStartDate > editEndDate) {
      alert('開始日期不能晚於結束日期！');
      return;
    }

    onUpdateSchedule({
      ...selectedScheduleForDetail,
      startDate: editStartDate,
      endDate: editEndDate,
      priority: editPriority,
      notes: editNotes.trim() || undefined
    });

    setSelectedScheduleForDetail(null);
  };

  // Delete Schedule
  const handleDeleteSchedule = () => {
    if (!selectedScheduleForDetail) return;
    if (window.confirm(`確定要將此專案從「${selectedScheduleForDetail.craftName}」排程中移除嗎？`)) {
      onDeleteSchedule(selectedScheduleForDetail.id);
      setSelectedScheduleForDetail(null);
    }
  };

  // Add Craft Category
  const handleCreateCraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCraftName.trim()) return;
    onAddCraft(newCraftName.trim());
    setSelectedCraft(newCraftName.trim());
    setNewCraftName('');
    setIsAddCraftModalOpen(false);
  };

  // Color generator based on priority (高 / 中 / 低)
  const getPriorityColorStyle = (priority?: '高' | '中' | '低') => {
    if (priority === '高') {
      // 經典印染赤紅 / 朱砂
      return { 
        line: 'bg-rose-700', 
        dot: 'bg-rose-700 border-rose-100', 
        text: 'text-rose-900',
        badge: 'bg-rose-50 text-rose-700 border-rose-200' 
      };
    }
    if (priority === '低') {
      // 印刷碧玉 / 青竹松綠 (不使用灰色，高雅的印刷草木青翠綠)
      return { 
        line: 'bg-emerald-600', 
        dot: 'bg-emerald-600 border-emerald-100', 
        text: 'text-emerald-900',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      };
    }
    // Default '中': 暖金棕 / 琥珀黃
    return { 
      line: 'bg-amber-600', 
      dot: 'bg-amber-600 border-amber-100', 
      text: 'text-amber-900',
      badge: 'bg-amber-50 text-amber-700 border-amber-200' 
    };
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      {/* Top Header & Controls */}
      <div className="bg-white p-5 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-stone-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-100/70 p-1 rounded-xl border border-stone-200/60">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
              title="上個月"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-3 py-1 font-serif font-bold text-stone-800 text-base flex items-center gap-2 tabular-nums">
              <Calendar size={16} className="text-red-800" />
              <span>{currentYear} 年 {currentMonth + 1} 月</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
              title="下個月"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100/80 hover:bg-stone-200/80 hover:text-stone-900 rounded-lg transition-colors border border-stone-200/50"
          >
            回到今天
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋專案或工藝..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={() => openAssignModal()}
            className="bg-red-800 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-red-900 transition-all shadow-sm hover:shadow flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={15} />
            <span>指派專案排程</span>
          </button>
        </div>
      </div>

      {/* Craft Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCraft('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
            selectedCraft === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
          }`}
        >
          全部工藝 ({craftSchedules.length})
        </button>

        {allCraftsList.map(craft => {
          const count = craftSchedules.filter(s => s.craftName === craft).length;
          const isSelected = selectedCraft === craft;

          return (
            <div
              key={craft}
              className={`inline-flex items-center rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-red-800 text-white border-red-800 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <button
                onClick={() => setSelectedCraft(craft)}
                className="pl-3 pr-2 py-1.5 flex items-center gap-1.5"
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-red-700'}`}></span>
                <span>{craft}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCraft(craft);
                  if (selectedCraft === craft) setSelectedCraft('all');
                }}
                className={`p-1 mr-1.5 rounded-lg transition-colors ${
                  isSelected 
                    ? 'text-white/70 hover:text-white hover:bg-white/20' 
                    : 'text-stone-300 hover:text-rose-600 hover:bg-rose-50'
                }`}
                title={`刪除「${craft}」工藝分類`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setIsAddCraftModalOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap text-stone-500 hover:text-red-800 bg-stone-100/70 hover:bg-stone-200/60 border border-dashed border-stone-300 transition-colors flex items-center gap-1"
        >
          <Plus size={13} />
          <span>新增工藝</span>
        </button>
      </div>

      {/* Month Calendar Grid Canvas */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-stone-200 overflow-hidden">
        {/* Weekday Columns Header */}
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center">
          {WEEKDAYS.map((w, i) => (
            <div 
              key={w} 
              className={`py-3 text-xs font-bold tracking-wider ${
                i === 0 || i === 6 ? 'text-red-800' : 'text-stone-600'
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Calendar Week Rows */}
        <div className="divide-y divide-stone-200">
          {calendarWeeks.map((week) => {
            const segments = getSegmentsForWeek(week);

            return (
              <div key={week.weekIndex} className="relative min-h-[125px] flex flex-col group/week">
                {/* 7-day Background Cells */}
                <div className="grid grid-cols-7 absolute inset-0 pointer-events-none divide-x divide-stone-100">
                  {week.days.map((day) => {
                    const projectCountOnDay = projectCountPerDate.get(day.dateStr) || 0;
                    const isBusyDay = projectCountOnDay >= 4;

                    return (
                      <div
                        key={day.dateStr}
                        className={`h-full p-2 transition-colors relative ${
                          isBusyDay
                            ? day.isCurrentMonth
                              ? 'bg-amber-50/80'
                              : 'bg-amber-50/30 text-stone-300'
                            : !day.isCurrentMonth
                            ? 'bg-stone-50/40 text-stone-300'
                            : day.isWeekend
                            ? 'bg-stone-50/25 text-stone-600'
                            : 'bg-white text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-mono font-medium tabular-nums ${
                              day.isToday
                                ? 'w-6 h-6 rounded-full bg-red-800 text-white flex items-center justify-center font-bold shadow-sm'
                                : !day.isCurrentMonth
                                ? 'text-stone-300'
                                : isBusyDay
                                ? 'text-amber-900 font-bold'
                                : 'text-stone-500'
                            }`}
                          >
                            {day.dayNumber}
                          </span>

                          {/* Busy Day Alert (Pulsing amber dot only) */}
                          {isBusyDay && day.isCurrentMonth && (
                            <span 
                              className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
                              title={`高負載：此日共有 ${projectCountOnDay} 個專案排程進行中`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Day Number Spacing Area */}
                <div className="h-8 shrink-0"></div>

                {/* Schedule Thin Lines Container */}
                <div className="relative z-10 px-1 pb-2 space-y-1.5 flex-1">
                  {segments.map((segment) => {
                    const project = projects.find(p => p.id === segment.schedule.projectId);
                    const colorStyle = getPriorityColorStyle(segment.schedule.priority);
                    const diff = project?.deadline ? getDiffDays(project.deadline) : null;

                    // Compute grid column coordinates (1-based for CSS Grid)
                    const gridColStart = segment.startCol + 1;
                    const gridColEnd = segment.endCol + 2;

                    return (
                      <div
                        key={`${segment.schedule.id}-w${week.weekIndex}`}
                        className="grid grid-cols-7"
                      >
                        <div
                          style={{
                            gridColumnStart: gridColStart,
                            gridColumnEnd: gridColEnd
                          }}
                          className="px-1"
                        >
                          {/* Thin Line Interactive Element */}
                          <div
                            onClick={() => handleOpenDetail(segment.schedule)}
                            className="group/line cursor-pointer py-1 relative flex flex-col justify-center transition-all duration-150"
                            title={`點擊查看：${segment.schedule.craftName} - ${project?.name || ''} (${segment.schedule.startDate} ~ ${segment.schedule.endDate}，緊急度：${segment.schedule.priority || '中'})`}
                          >
                            {/* Soft & Compact Project Title Label above line (No '高' tag) */}
                            <div className="flex items-center justify-between text-[10px] leading-tight mb-0.5 px-0.5 opacity-85 group-hover/line:opacity-100 transition-opacity">
                              <span className="font-sans font-normal text-stone-600 truncate group-hover/line:text-stone-900 group-hover/line:underline tracking-normal">
                                {project ? project.name : '（已刪專案）'}
                              </span>
                              <span className="text-[9px] text-stone-400 font-sans tabular-nums shrink-0 ml-1">
                                {segment.totalDays}天
                              </span>
                            </div>

                            {/* The Delicate Thin Line (4px) with Nodes */}
                            <div className="relative h-1 w-full flex items-center">
                              {/* Background track */}
                              <div className={`h-1 w-full rounded-full ${colorStyle.line} group-hover/line:brightness-90 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.1)]`} />

                              {/* Start Node (if this week is the actual start date) */}
                              {segment.isStartActual ? (
                                <div className={`absolute left-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm -translate-x-1/2 ${colorStyle.line}`} />
                              ) : (
                                <div className="absolute left-0 text-[9px] -translate-x-1.5 text-stone-400 font-bold">◄</div>
                              )}

                              {/* End Node (if this week is the actual end date) */}
                              {segment.isEndActual ? (
                                <div className={`absolute right-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm translate-x-1/2 ${colorStyle.line}`} />
                              ) : (
                                <div className="absolute right-0 text-[9px] translate-x-1.5 text-stone-400 font-bold">►</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Summary Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500 px-1">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-800"></span>
            <span>今天</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>高負載提醒（單日4個以上專案）</span>
          </div>
          <div className="w-px h-3 bg-stone-200 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <span className="text-stone-400">緊急度顏色：</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-1 bg-rose-700 rounded-full"></div>
              <span className="text-stone-700 font-medium">高 (赤紅)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-1 bg-amber-600 rounded-full"></div>
              <span className="text-stone-700 font-medium">中 (琥珀)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-1 bg-emerald-600 rounded-full"></div>
              <span className="text-stone-700 font-medium">低 (翠綠)</span>
            </div>
          </div>
        </div>

        <div className="text-stone-400 font-mono tabular-nums">
          目前共 {filteredSchedules.length} 筆工藝排程
        </div>
      </div>

      {/* MODAL 1: Assign Project to Craft Schedule */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-800 text-white flex items-center justify-center">
                    <Plus size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-stone-800 font-serif">指派專案進工藝排程</h3>
                    <p className="text-xs text-stone-400">僅能從目前現有卡片專案中選取加入月曆排程</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                {/* Craft Selection */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    工藝類別
                  </label>
                  <select
                    value={assignCraft}
                    onChange={(e) => setAssignCraft(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors"
                    required
                  >
                    {allCraftsList.map(craft => (
                      <option key={craft} value={craft}>{craft}</option>
                    ))}
                  </select>
                </div>

                {/* Project Selection from Existing Cards */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    選擇現有進行中專案
                  </label>
                  {activeProjects.length === 0 ? (
                    <div className="text-xs text-stone-400 p-3 bg-stone-50 rounded-xl border border-stone-200">
                      目前沒有任何進行中的專案，請先至看板建立卡片專案。
                    </div>
                  ) : (
                    <select
                      value={assignProjectId || ''}
                      onChange={(e) => setAssignProjectId(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors"
                      required
                    >
                      {activeProjects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.deadline ? `(截止: ${p.deadline})` : ''} {p.tags?.length ? `[${p.tags.join(', ')}]` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">
                      開始進場日期
                    </label>
                    <input
                      type="date"
                      value={assignStartDate}
                      onChange={(e) => setAssignStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">
                      預計完成日期
                    </label>
                    <input
                      type="date"
                      value={assignEndDate}
                      onChange={(e) => setAssignEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    緊急度（影響甘特圖垂直排列順序）
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['高', '中', '低'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAssignPriority(p)}
                        className={`py-2 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          assignPriority === p
                            ? p === '高' 
                              ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm font-bold'
                              : p === '中'
                              ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm font-bold'
                              : 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm font-bold'
                            : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          p === '高' ? 'bg-rose-600' : p === '中' ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}></span>
                        <span>{p === '高' ? '高 (最急)' : p === '中' ? '中 (正常)' : '低 (一般)'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    排程備註（選填）
                  </label>
                  <input
                    type="text"
                    value={assignNotes}
                    onChange={(e) => setAssignNotes(e.target.value)}
                    placeholder="例：外包廠師傅確認、燙印金箔色號..."
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={activeProjects.length === 0}
                    className="bg-red-800 text-white px-5 py-2 text-xs font-medium rounded-xl hover:bg-red-900 transition shadow disabled:opacity-50"
                  >
                    建立排程
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Schedule Detail & Edit Modal */}
      <AnimatePresence>
        {selectedScheduleForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200"
            >
              {(() => {
                const project = projects.find(p => p.id === selectedScheduleForDetail.projectId);
                const colorStyle = getPriorityColorStyle(selectedScheduleForDetail.priority);
                const craftTagClass = getTagColorClass(selectedScheduleForDetail.craftName, tagColors);
                const diff = project?.deadline ? getDiffDays(project.deadline) : null;

                const startD = parseLocalDate(selectedScheduleForDetail.startDate);
                const endD = parseLocalDate(selectedScheduleForDetail.endDate);
                const totalDays = Math.max(1, Math.round((endD.getTime() - startD.getTime()) / 86400000) + 1);

                return (
                  <div>
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${craftTagClass}`}>
                            {selectedScheduleForDetail.craftName}
                          </span>
                          <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                            selectedScheduleForDetail.priority === '高'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                              : selectedScheduleForDetail.priority === '低'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                              : 'bg-amber-50 text-amber-700 border-amber-200 font-bold'
                          }`}>
                            緊急度：{selectedScheduleForDetail.priority || '中'}
                          </span>
                          <span className="text-xs text-stone-400">工藝排程細節</span>
                        </div>
                        <h3 className="text-lg font-bold text-stone-800 font-serif">
                          {project ? project.name : '（專案已刪除）'}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedScheduleForDetail(null)}
                        className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-6 space-y-4">
                      {/* Project quick meta */}
                      <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/60 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">工藝排程工期：</span>
                          <span className="font-mono font-medium text-stone-800 tabular-nums">
                            {selectedScheduleForDetail.startDate} 至 {selectedScheduleForDetail.endDate}（共 {totalDays} 天）
                          </span>
                        </div>
                        {project?.deadline && (
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">專案總截稿日：</span>
                            <span className={`font-mono font-medium tabular-nums ${
                              diff !== null && diff <= 0 ? 'text-rose-600 font-bold' :
                              diff !== null && diff <= 3 ? 'text-orange-600 font-medium' :
                              'text-stone-800'
                            }`}>
                              {project.deadline} {diff !== null ? `(${diff < 0 ? `逾期 ${Math.abs(diff)} 天` : diff === 0 ? '今天截止' : `剩 ${diff} 天`})` : ''}
                            </span>
                          </div>
                        )}
                        {project?.tags?.length ? (
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">相關工藝標籤：</span>
                            <span className="text-stone-700">{project.tags.join('、')}</span>
                          </div>
                        ) : null}
                        
                        {project && (
                          <div className="pt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedScheduleForDetail(null);
                                onEditProject(project);
                              }}
                              className="w-full text-center py-2 text-red-800 hover:text-red-900 hover:bg-red-50/70 rounded-xl transition font-medium flex items-center justify-center gap-1.5 border border-red-200"
                            >
                              <ExternalLink size={14} />
                              <span>開啟完整卡片查看/編輯專案</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Date adjustments */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1.5">
                            排程開始日期
                          </label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1.5">
                            排程結束日期
                          </label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors font-mono"
                          />
                        </div>
                      </div>

                      {/* Priority adjustment */}
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">
                          緊急度（影響甘特圖垂直排列順序）
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['高', '中', '低'] as const).map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setEditPriority(p)}
                              className={`py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                                editPriority === p
                                  ? p === '高' 
                                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm font-bold'
                                    : p === '中'
                                    ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm font-bold'
                                    : 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm font-bold'
                                  : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                p === '高' ? 'bg-rose-600' : p === '中' ? 'bg-amber-500' : 'bg-emerald-600'
                              }`}></span>
                              <span>{p === '高' ? '高 (最急)' : p === '中' ? '中 (正常)' : '低 (一般)'}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">
                          備註說明
                        </label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="排程詳細需求或注意事項..."
                          className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="pt-3 flex items-center justify-between border-t border-stone-100">
                        <button
                          type="button"
                          onClick={handleDeleteSchedule}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          <span>移除此排程</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedScheduleForDetail(null)}
                            className="px-4 py-2 text-xs text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveScheduleEdit}
                            className="bg-red-800 text-white px-5 py-2 text-xs font-medium rounded-xl hover:bg-red-900 transition shadow"
                          >
                            儲存變更
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Add Craft Category Modal */}
      <AnimatePresence>
        {isAddCraftModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-stone-200"
            >
              <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <h3 className="text-sm font-bold text-stone-800 font-serif">新增工藝分類</h3>
                <button
                  onClick={() => setIsAddCraftModalOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateCraft} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    工藝名稱
                  </label>
                  <input
                    type="text"
                    value={newCraftName}
                    onChange={(e) => setNewCraftName(e.target.value)}
                    placeholder="例：局部白墨、滾金邊、壓花..."
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-red-800 focus:bg-white transition-colors"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddCraftModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="bg-red-800 text-white px-4 py-1.5 text-xs font-medium rounded-xl hover:bg-red-900 transition shadow"
                  >
                    新增
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GanttView;
