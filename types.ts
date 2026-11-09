export interface Stage {
  name: string;
  deadline: string;
  completed: boolean;
  tag?: string;
}

export interface Project {
  id: number;
  name: string;
  deadline: string;
  tags: string[];
  deliveryMethod?: '自取' | '宅配';
  notes?: string;
  archived: boolean;
  stages: Stage[];
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  fontSizeIndex: number; // 0-9
  updatedAt: number;
}

export type ViewType = 'dashboard' | 'calendar' | 'workspace' | 'archived' | 'memo' | 'gantt';

export interface CraftSchedule {
  id: string;
  craftName: string;
  projectId: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  priority?: '高' | '中' | '低';
  notes?: string;
  createdAt: number;
}

export interface DateStatus {
  text: string;
  colorClass: string;
  isUrgent: boolean;
  isOverdue: boolean;
}