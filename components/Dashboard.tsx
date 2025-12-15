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
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onEdit, onArchive, onDelete, onUpdate }) => {
  const activeProjects = projects.filter(p => !p.archived).sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

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
        />
      ))}
    </div>
  );
};

export default Dashboard;