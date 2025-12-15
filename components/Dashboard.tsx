import React from 'react';
import { Project } from '../types';
import ProjectCard from './ProjectCard';
import { FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  projects: Project[];
  onEdit: (p: Project) => void;
  onArchive: (p: Project) => void;
  onDelete: (id: number) => void;
  onUpdate: (p: Project) => void;
  tagColors: Record<string, string>;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onEdit, onArchive, onDelete, onUpdate, tagColors }) => {
  
  // Helper to determine the effective sorting date
  const getSortDate = (project: Project): number => {
    // Check for incomplete stages with valid deadlines
    const incompleteStagesWithDeadlines = project.stages
      .filter(s => !s.completed && s.deadline)
      .map(s => new Date(s.deadline).getTime());

    // If there are incomplete stages with deadlines, use the earliest one (Priority)
    if (incompleteStagesWithDeadlines.length > 0) {
      return Math.min(...incompleteStagesWithDeadlines);
    }

    // Otherwise (no incomplete stages with deadlines, or all complete), fallback to project deadline
    if (project.deadline) {
      return new Date(project.deadline).getTime();
    }

    // If no deadline exists at all, push to the end
    return Number.MAX_SAFE_INTEGER;
  };

  const activeProjects = projects
    .filter(p => !p.archived)
    .sort((a, b) => getSortDate(a) - getSortDate(b));

  if (activeProjects.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-24 text-stone-300"
      >
        <FolderOpen size={64} className="mb-4 stroke-[1]" />
        <p className="text-lg font-light">目前沒有進行中的專案。</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {activeProjects.map(project => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          onEdit={onEdit}
          onArchive={onArchive}
          onDelete={onDelete}
          onUpdate={onUpdate}
          tagColors={tagColors}
        />
      ))}
    </div>
  );
};

export default Dashboard;