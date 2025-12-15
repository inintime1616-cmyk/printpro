import React, { useState, useEffect } from 'react';
import { Project, Stage } from '../types';
import { X, Plus, Trash2, Tag as TagIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTagColorClass } from '../utils';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  initialData?: Project | null;
  availableTags: string[];
  onAddGlobalTag: (tag: string) => void;
  onDeleteGlobalTag: (tag: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ 
  isOpen, onClose, onSave, initialData, availableTags, onAddGlobalTag, onDeleteGlobalTag 
}) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    deadline: '',
    tags: [],
    deliveryMethod: undefined,
    stages: [{ name: '階段 1', deadline: '', completed: false }]
  });
  const [customTagInput, setCustomTagInput] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(JSON.parse(JSON.stringify(initialData)));
    } else {
      setFormData({
        name: '',
        deadline: '',
        tags: [],
        deliveryMethod: undefined,
        stages: [{ name: '階段 1', deadline: '', completed: false }]
      });
    }
    setCustomTagInput('');
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    if (!formData.name || !formData.deadline) {
      alert('請填寫專案名稱與總截止日');
      return;
    }
    onSave(formData);
  };

  const handleAddTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tag) }));
  };

  const handleCustomTagSubmit = () => {
    const val = customTagInput.trim();
    if (val) {
      handleAddTag(val);
      onAddGlobalTag(val);
      setCustomTagInput('');
    }
  };

  const handleStageChange = (idx: number, field: keyof Stage, value: any) => {
    const newStages = [...(formData.stages || [])];
    newStages[idx] = { ...newStages[idx], [field]: value };
    setFormData(prev => ({ ...prev, stages: newStages }));
  };

  const addStage = () => {
    setFormData(prev => ({
      ...prev,
      stages: [...(prev.stages || []), { name: '', deadline: '', completed: false }]
    }));
  };

  const removeStage = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      stages: prev.stages?.filter((_, i) => i !== idx)
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" 
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#fdfbf9] rounded-2xl w-full max-w-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-stone-200"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-8 py-6 border-b border-stone-100">
            <h2 className="text-2xl font-bold text-stone-800 font-serif tracking-wide">{initialData ? '編輯內容' : '新建專案'}</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition">
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">專案名稱</label>
                <input 
                  value={formData.name} 
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  type="text" 
                  className="w-full rounded-lg border-stone-200 border bg-white px-3 py-2.5 text-stone-800 focus:ring-1 focus:ring-red-800 focus:border-red-800 outline-none transition-all shadow-sm"
                  placeholder="例如：2024 春季型錄"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">總截止日</label>
                <input 
                  value={formData.deadline} 
                  onChange={e => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  type="date" 
                  className="w-full rounded-lg border-stone-200 border bg-white px-3 py-2.5 text-stone-800 focus:ring-1 focus:ring-red-800 focus:border-red-800 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Delivery Method Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">取件方式</label>
              <div className="flex gap-4">
                {['自取', '宅配'].map((method) => (
                  <label key={method} className={`flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${formData.deliveryMethod === method ? 'bg-red-50 border-red-800 text-red-900' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}>
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={method}
                      checked={formData.deliveryMethod === method}
                      onChange={() => setFormData(prev => ({ ...prev, deliveryMethod: method as '自取' | '宅配' }))}
                      className="text-red-800 focus:ring-red-800 accent-red-800"
                    />
                    <span className="text-sm font-medium">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">工藝標籤</label>
              
              {/* Selected Tags */}
              <div className="flex flex-wrap gap-2 mb-4 min-h-[46px] p-3 bg-white rounded-xl border border-dashed border-stone-300">
                {formData.tags?.length === 0 && <span className="text-stone-300 text-sm self-center italic">點選下方標籤加入...</span>}
                {formData.tags?.map(tag => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-sm font-medium flex items-center animate-fadeIn border ${getTagColorClass(tag)}`}>
                    {tag} 
                    <button onClick={() => handleRemoveTag(tag)} className="ml-2 opacity-60 hover:opacity-100">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Quick Select */}
              <div className="mb-4">
                 <p className="text-[10px] text-stone-400 mb-2 font-medium tracking-wide">常用標籤庫</p>
                 <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => {
                       const isSelected = formData.tags?.includes(tag);
                       return (
                       <div key={tag} className={`inline-flex items-center rounded-lg text-xs overflow-hidden transition-all duration-300 ${isSelected ? 'opacity-50 grayscale' : 'shadow-sm hover:shadow-md'}`}>
                          <button onClick={() => handleAddTag(tag)} className={`px-3 py-1.5 transition h-full font-medium ${getTagColorClass(tag)} border-0`}>{tag}</button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteGlobalTag(tag); }} 
                            className="px-2 py-1.5 bg-white border-l border-stone-100 text-stone-300 hover:text-red-500 transition h-full"
                          >
                            <X size={10} />
                          </button>
                       </div>
                    )})}
                 </div>
              </div>

              {/* Add Custom Tag */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3 top-2.5 text-stone-400" size={16} />
                  <input 
                    value={customTagInput} 
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCustomTagSubmit()}
                    type="text" 
                    placeholder="輸入新標籤..." 
                    className="w-full rounded-lg border-stone-200 border pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-red-800 outline-none bg-white"
                  />
                </div>
                <button onClick={handleCustomTagSubmit} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 transition">
                  新增
                </button>
              </div>
            </div>

            {/* Stages Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest">階段時程</label>
                <button onClick={addStage} className="text-red-800 text-xs font-bold hover:text-red-900 flex items-center px-2 py-1 rounded hover:bg-red-50 transition">
                  <Plus size={14} className="mr-1" /> 新增階段
                </button>
              </div>
              <div className="space-y-2.5">
                {formData.stages?.map((stage, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="w-6 text-center text-stone-300 text-xs font-mono">{idx + 1}</div>
                    <input 
                      type="text" 
                      value={stage.name} 
                      onChange={e => handleStageChange(idx, 'name', e.target.value)}
                      className="flex-1 rounded-md border-stone-200 border p-2 text-sm focus:border-red-800 focus:ring-1 focus:ring-red-800 outline-none bg-white"
                      placeholder="階段名稱"
                    />
                    <input 
                      type="date" 
                      value={stage.deadline} 
                      onChange={e => handleStageChange(idx, 'deadline', e.target.value)}
                      className="w-36 rounded-md border-stone-200 border p-2 text-sm focus:border-red-800 focus:ring-1 focus:ring-red-800 outline-none text-stone-600 bg-white"
                    />
                    <button onClick={() => removeStage(idx)} className="text-stone-300 hover:text-red-500 p-2 transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-stone-100 flex justify-end gap-4 bg-white">
            <button onClick={onClose} className="px-6 py-2 text-stone-500 hover:bg-stone-100 rounded-lg font-medium transition">取消</button>
            <button onClick={handleSubmit} className="px-8 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 font-bold shadow-lg shadow-red-100 hover:shadow-xl hover:-translate-y-0.5 transition-all">
              {initialData ? '儲存變更' : '建立專案'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProjectModal;