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

export type ViewType = 'dashboard' | 'calendar' | 'workspace' | 'archived' | 'memo';

export interface DateStatus {
  text: string;
  colorClass: string;
  isUrgent: boolean;
  isOverdue: boolean;
}