import React from 'react';
import { Project } from '../types';
import { getCurrentStageName, getProjectStatus, getDiffDays, getTagColorClass } from '../utils';
import { Tag, MapPin, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface WorkspaceViewProps {
  projects: Project[];
  onEdit: (p: Project) => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({ projects, onEdit }) => {
  const activeProjects = projects.filter(p => !p.archived);
  const usedTags = Array.from(new Set<string>(activeProjects.flatMap(p => p.tags))).sort();

  const getDeadlineClass = (deadline: string) => {
    const diff = getDiffDays(deadline);
    if (diff < 0) return 'text-stone-400 line-through';
    if (diff <= 3) return 'text-red-700 font-bold';
    return 'text-stone-500';
  };

  const getStatusBadge = (p: Project) => {
    const s = getProjectStatus(p);
    // Custom minimal badges
    if (s === '已完成') return <span className="text-emerald-600 font-medium text-xs border border-emerald-200 px-2 py-0.5 rounded-sm bg-emerald-50">完成</span>;
    if (s === '進行中') return <span className="text-stone-600 font-medium text-xs border border-stone-200 px-2 py-0.5 rounded-sm bg-stone-50">進行</span>;
    return <span className="text-stone-400 font-medium text-xs">--</span>;
  };

  if (usedTags.length === 0) {
     return <div className="text-center py-24 text-stone-400 font-light">目前沒有使用任何工藝標籤的進行中專案。</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-10">
      {usedTags.map(tag => {
        const taggedProjects = activeProjects.filter(p => p.tags.includes(tag));
        if (taggedProjects.length === 0) return null;

        // Use the same color logic for the section header
        const colorClass = getTagColorClass(tag); 
        // Extract border color to use as accent line
        const borderColor = colorClass.split(' ').find(c => c.startsWith('border-'))?.replace('border-', '') || 'stone-200';

        return (
          <div key={tag} className="bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className={`px-6 py-4 border-b flex items-center justify-between bg-stone-50/50`}>
              <div className="flex items-center">
                 <span className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${colorClass}`}>
                    <Tag size={14} />
                 </span>
                 <h2 className="text-lg font-bold text-stone-800 tracking-wide font-serif">{tag}</h2>
              </div>
              <span className="text-xs text-stone-400 font-mono">COUNT: {taggedProjects.length}</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="text-stone-400 border-b border-stone-100 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-normal w-1/3">Project</th>
                    <th className="px-6 py-4 font-normal">Current Stage</th>
                    <th className="px-6 py-4 font-normal">Due Date</th>
                    <th className="px-6 py-4 font-normal text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {taggedProjects.map(project => {
                    const currentStage = getCurrentStageName(project);
                    return (
                      <tr 
                        key={project.id} 
                        onClick={() => onEdit(project)}
                        className="hover:bg-red-50/30 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-stone-700 group-hover:text-red-800 transition-colors">
                            {project.name}
                        </td>
                        <td className="px-6 py-4 text-stone-600 font-medium flex items-center h-full">
                          {currentStage !== '已完成' && (
                             <MapPin size={14} className="mr-2 text-red-800 opacity-80" fill="currentColor" />
                          )}
                          {currentStage === '已完成' && (
                             <CheckCircle2 size={14} className="mr-2 text-emerald-500" />
                          )}
                          {currentStage}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${getDeadlineClass(project.deadline)} font-mono text-xs`}>{project.deadline}</span>
                        </td>
                        <td className="px-6 py-4 text-right">{getStatusBadge(project)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
};

export default WorkspaceView;