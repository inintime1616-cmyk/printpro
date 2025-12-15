import React from 'react';
import { Project } from '../types';
import { Info, Trash2, RotateCcw, PackageOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface ArchivedViewProps {
  projects: Project[];
  onUnarchive: (p: Project) => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  tagColors: Record<string, string>;
}

const ArchivedView: React.FC<ArchivedViewProps> = ({ projects, onUnarchive, onDelete, onClearAll, tagColors }) => {
  const archivedProjects = projects.filter(p => p.archived).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-stone-100 p-4 rounded-xl border border-stone-200">
        <div className="text-stone-600 text-[13.5px] flex items-center">
          <Info size={16} className="mr-2 text-stone-500" />
          已結案的歷史專案。
        </div>
        {archivedProjects.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('警告：這將會永久刪除所有已歸檔的專案，無法復原！確定嗎？')) {
                onClearAll();
              }
            }}
            className="bg-stone-600 text-white text-[13.5px] px-4 py-2 rounded-lg hover:bg-stone-700 transition shadow flex items-center"
          >
            <Trash2 size={14} className="mr-1.5" />
            清空歸檔
          </button>
        )}
      </div>

      {archivedProjects.length === 0 ? (
        <div className="text-center py-20 text-stone-300">
          <PackageOpen size={64} className="mx-auto mb-4 stroke-[1]" />
          <p className="font-light text-[15px]">目前沒有已歸檔的專案。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedProjects.map(project => (
            <div key={project.id} className="bg-[#fcfaf8] rounded-xl p-6 border border-stone-200 hover:border-stone-300 transition group relative opacity-80 hover:opacity-100">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-stone-500 line-through decoration-stone-300 decoration-1">{project.name}</h3>
                <div className="flex gap-2">
                  <button onClick={() => onUnarchive(project)} title="還原" className="text-stone-400 hover:text-emerald-600 p-1.5 bg-white rounded shadow-sm hover:shadow transition border border-stone-100">
                    <RotateCcw size={16} />
                  </button>
                  <button onClick={() => onDelete(project.id)} title="永久刪除" className="text-stone-400 hover:text-red-500 p-1.5 bg-white rounded shadow-sm hover:shadow transition border border-stone-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-[13.5px] text-stone-400 mb-4 font-mono">歸檔日期：{project.deadline}</div>
              <div className="flex flex-wrap gap-2">
                {project.tags.map(tag => (
                  <span key={tag} className="text-[13.5px] bg-stone-200 text-stone-500 px-2 py-1 rounded-sm">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ArchivedView;