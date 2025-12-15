export interface Stage {
  name: string;
  deadline: string;
  completed: boolean;
}

export interface Project {
  id: number;
  name: string;
  deadline: string;
  tags: string[];
  deliveryMethod?: '自取' | '宅配';
  archived: boolean;
  stages: Stage[];
}

export type ViewType = 'dashboard' | 'calendar' | 'workspace' | 'archived';

export interface DateStatus {
  text: string;
  colorClass: string;
  isUrgent: boolean;
  isOverdue: boolean;
}