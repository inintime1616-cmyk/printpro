import React from 'react';
import { Project } from '../types';
import { getDeadlineStatus, getProjectStatus, getDiffDays, getTagColorClass } from '../utils';
import { Clock, Pen, Archive, Trash2, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (id: number) => void;
  onUpdate: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onArchive, onDelete, onUpdate }) => {
  const statusInfo = getDeadlineStatus(project.deadline);
  const projectStatus = getProjectStatus(project);

  const handleStageToggle = (index: number) => {
    const updatedStages = [...project.stages];
    updatedStages[index].completed = !updatedStages[index].completed;
    onUpdate({ ...project, stages: updatedStages });
  };

  const getBorderColor = () => {
    if (projectStatus === '已完成') return 'border-l-emerald-600';
    if (statusInfo.isOverdue) return 'border-l-stone-400';
    if (statusInfo.isUrgent) return 'border-l-red-600';
    return 'border-l-stone-300'; // Neutral default
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`bg-white rounded-xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-500 border-l-[3px] ${getBorderColor()} relative group border border-stone-50`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-stone-800 break-words w-9/12 leading-snug font-serif tracking-wide">{project.name}</h3>
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button onClick={() => onEdit(project)} className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition">
            <Pen size={15} />
          </button>
          <button onClick={() => onArchive(project)} className="text-stone-400 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition">
            <Archive size={15} />
          </button>
          <button onClick={() => onDelete(project.id)} className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Tags with Exclusive Colors */}
      <div className="flex flex-wrap gap-2 mb-5">
        {project.tags.map(tag => (
          <span key={tag} className={`text-[11px] px-2.5 py-1 rounded border ${getTagColorClass(tag)} font-medium tracking-wide`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Status Box */}
      <div className={`mb-5 px-3 py-2 rounded border-l-2 ${statusInfo.colorClass.replace('bg-', 'bg-opacity-40 ')} flex items-center justify-between`}>
        <div className="text-xs font-medium flex items-center opacity-90">
          <Clock size={13} className="mr-2" />
          <span className="tracking-wider">{project.deadline}</span>
        </div>
        <div className="text-xs font-bold">{statusInfo.text}</div>
      </div>

      {/* Stages */}
      <div className="space-y-1.5 mb-5">
        {project.stages.map((stage, idx) => {
          const isUrgent = !stage.completed && stage.deadline && getDiffDays(stage.deadline) <= 3;
          
          return (
            <div key={idx} className="flex items-start justify-between text-sm py-1 group/stage">
              <label className="flex items-center w-8/12 cursor-pointer">
                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2.5 transition-colors duration-300 ${stage.completed ? 'bg-red-800 border-red-800' : 'bg-white border-stone-300 hover:border-red-400'}`}>
                    {stage.completed && <Check size={10} className="text-white" />}
                </div>
                <input 
                  type="checkbox" 
                  checked={stage.completed} 
                  onChange={() => handleStageToggle(idx)}
                  className="hidden"
                />
                <span className={`break-all text-[13px] leading-tight transition-all duration-300 ${stage.completed ? 'line-through text-stone-300' : 'text-stone-600 font-medium'}`}>
                  {stage.name}
                </span>
              </label>
              
              <div className={`text-[11px] whitespace-nowrap flex items-center justify-end w-4/12 ${isUrgent ? 'text-red-600 font-bold' : 'text-stone-300'}`}>
                {isUrgent && <AlertCircle size={11} className="mr-1 fill-red-50" />}
                {stage.deadline}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-3 border-t border-stone-100 flex justify-between items-center">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest
          ${projectStatus === '已完成' ? 'bg-emerald-100 text-emerald-700' : 
            projectStatus === '進行中' ? 'bg-stone-100 text-stone-600' : 'bg-stone-50 text-stone-400'}`}>
          {projectStatus}
        </span>
        
        {projectStatus === '已完成' && (
          <button 
            onClick={() => onArchive(project)} 
            className="flex items-center bg-stone-800 text-white text-[11px] px-3 py-1.5 rounded hover:bg-stone-700 transition shadow-sm hover:shadow active:scale-95"
          >
            <Archive size={12} className="mr-1.5" />
            歸檔
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;