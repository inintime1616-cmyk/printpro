import React, { useState, useEffect, useRef } from 'react';
import { Memo } from '../types';
import { Plus, X, Type, Highlighter, PenLine, Edit2, Check, Trash2, List, ListOrdered, CheckSquare, Strikethrough } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';

interface MemoViewProps {
  initialMemos: Memo[];
  onUpdateMemos: (memos: Memo[]) => void;
}

const HIGHLIGHT_COLORS = [
  { label: '無', color: 'transparent', border: 'border-stone-200' },
  { label: '藤黄', color: '#fcd575', border: 'border-yellow-200' }, // Yellow
  { label: '水浅葱', color: '#a0d8ef', border: 'border-blue-200' }, // Blue
  { label: '若草', color: '#cde6c7', border: 'border-green-200' }, // Green
  { label: '桃花', color: '#f5c9c9', border: 'border-red-200' },   // Pink
];

const MemoView: React.FC<MemoViewProps> = ({ initialMemos, onUpdateMemos }) => {
  const [memos, setMemos] = useState<Memo[]>(initialMemos);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  
  // Refs for editor interaction
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Initialize if empty
  useEffect(() => {
    if (memos.length === 0) {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        title: '未命名筆記',
        content: '開始寫下您的想法...',
        fontSizeIndex: 2,
        updatedAt: Date.now()
      };
      setMemos([newMemo]);
      setActiveTabId(newMemo.id);
      onUpdateMemos([newMemo]);
    } else if (!activeTabId) {
      setActiveTabId(memos[0].id);
    }
  }, []);

  const activeMemo = memos.find(m => m.id === activeTabId);

  // Auto-save debouncer
  const handleContentChange = () => {
    if (!editorRef.current || !activeTabId) return;
    
    const newContent = editorRef.current.innerHTML;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = window.setTimeout(() => {
      setMemos(prev => {
        const updated = prev.map(m => 
          m.id === activeTabId ? { ...m, content: newContent, updatedAt: Date.now() } : m
        );
        onUpdateMemos(updated);
        return updated;
      });
    }, 800); // Save after 800ms of inactivity
  };

  // Sync content to editor when tab changes
  useEffect(() => {
    if (editorRef.current && activeMemo) {
      if (editorRef.current.innerHTML !== activeMemo.content) {
         editorRef.current.innerHTML = activeMemo.content;
      }
    }
  }, [activeTabId, activeMemo]);

  const handleAddTab = () => {
    const newMemo: Memo = {
      id: crypto.randomUUID(),
      title: '新記事',
      content: '',
      fontSizeIndex: 2,
      updatedAt: Date.now()
    };
    const updated = [...memos, newMemo];
    setMemos(updated);
    setActiveTabId(newMemo.id);
    onUpdateMemos(updated);
  };

  const handleDeleteTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (memos.length <= 1) {
        alert("至少需要保留一個頁面。");
        return;
    }
    if (window.confirm('確定要刪除此頁面嗎？')) {
      const updated = memos.filter(m => m.id !== id);
      setMemos(updated);
      if (activeTabId === id) {
        setActiveTabId(updated[0].id);
      }
      onUpdateMemos(updated);
    }
  };

  const handleReorderTabs = (newOrder: Memo[]) => {
    setMemos(newOrder);
    onUpdateMemos(newOrder);
  };

  const handleRename = () => {
    if (!activeTabId || !tempTitle.trim()) return;
    const updated = memos.map(m => m.id === activeTabId ? { ...m, title: tempTitle } : m);
    setMemos(updated);
    onUpdateMemos(updated);
    setIsEditingTitle(false);
  };

  const handleExecCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
    }
    handleContentChange();
  };

  const handleInsertCheckbox = () => {
    // Insert a checkbox input
    const checkboxHtml = '<input type="checkbox" style="vertical-align: middle; margin-right: 6px; transform: scale(1.2);" />&nbsp;';
    document.execCommand('insertHTML', false, checkboxHtml);
    if (editorRef.current) {
        editorRef.current.focus();
    }
    handleContentChange();
  };

  // Handle clicking on checkboxes inside contentEditable to toggle their state attribute
  // This is required because simply clicking a checkbox in contentEditable doesn't always update the DOM attribute for innerHTML
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
        const input = target as HTMLInputElement;
        // We need to manually toggle the attribute so it saves to the HTML string correctly
        if (input.checked) {
            input.setAttribute('checked', 'true');
        } else {
            input.removeAttribute('checked');
        }
        handleContentChange();
    }
  };

  const handleFontSize = (action: 'increase' | 'decrease') => {
    // Attempt to determine current font size
    let currentSize = 3; // Default (normally 16px or size 3)
    const val = document.queryCommandValue('fontSize');
    if (val) {
        if (val.includes('px')) {
             const px = parseInt(val);
             // Approximate mapping for Chrome/Webkit
             if (px <= 10) currentSize = 1;
             else if (px <= 13) currentSize = 2;
             else if (px <= 16) currentSize = 3;
             else if (px <= 18) currentSize = 4;
             else if (px <= 24) currentSize = 5;
             else if (px <= 32) currentSize = 6;
             else currentSize = 7;
        } else {
             currentSize = parseInt(val) || 3;
        }
    }
    
    let newSize = action === 'increase' ? currentSize + 1 : currentSize - 1;
    if (newSize < 1) newSize = 1;
    if (newSize > 7) newSize = 7;
    
    document.execCommand('fontSize', false, newSize.toString());
    handleContentChange();
    if (editorRef.current) editorRef.current.focus();
  };

  // Safe color application
  const applyHighlight = (color: string) => {
    document.execCommand('hiliteColor', false, color);
    handleContentChange();
  };

  if (!activeMemo) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-140px)] gap-4">
      
      {/* 1. Tabs Area (Draggable) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar border-b border-stone-200">
        <Reorder.Group 
            axis="x" 
            values={memos} 
            onReorder={handleReorderTabs} 
            className="flex items-center gap-1"
        >
            {memos.map(memo => (
            <Reorder.Item 
                key={memo.id} 
                value={memo}
                className="relative"
            >
                <div 
                    onClick={() => setActiveTabId(memo.id)}
                    className={`
                    group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl cursor-pointer transition-all duration-200 border-t border-x select-none
                    ${activeTabId === memo.id 
                        ? 'bg-[#fdfbf9] border-stone-200 text-stone-800 shadow-[0_4px_0_#fdfbf9] translate-y-[1px] z-10' 
                        : 'bg-stone-100 border-transparent text-stone-400 hover:bg-stone-50 hover:text-stone-600'}
                    `}
                >
                    <span className="max-w-[120px] truncate text-[13.5px] font-medium tracking-wide">
                    {memo.title}
                    </span>
                    <button 
                    onClick={(e) => handleDeleteTab(e, memo.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-stone-200 text-stone-400 hover:text-red-500 transition-all"
                    >
                    <X size={12} />
                    </button>
                </div>
            </Reorder.Item>
            ))}
        </Reorder.Group>
        
        <button 
          onClick={handleAddTab}
          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors ml-1"
          title="新增分頁"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* 2. Memo Container */}
      <div className="flex-1 bg-[#fdfbf9] rounded-b-xl rounded-tr-xl shadow-sm border border-stone-200 flex flex-col relative overflow-hidden">
        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between p-3 border-b border-stone-100 bg-white/50 backdrop-blur-sm gap-4">
            
            {/* Left: Title Editing */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                {isEditingTitle ? (
                    <div className="flex items-center gap-1 animate-fadeIn">
                        <input 
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            className="bg-white border border-stone-300 rounded px-2 py-1 text-sm text-stone-800 focus:border-red-800 outline-none w-48 font-serif"
                            autoFocus
                        />
                        <button onClick={handleRename} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check size={16}/></button>
                        <button onClick={() => setIsEditingTitle(false)} className="p-1 text-stone-400 hover:bg-stone-100 rounded"><X size={16}/></button>
                    </div>
                ) : (
                    <div 
                        onClick={() => { setTempTitle(activeMemo.title); setIsEditingTitle(true); }}
                        className="flex items-center gap-2 group cursor-pointer px-2 py-1 rounded hover:bg-stone-100/50 transition"
                    >
                        <span className="text-lg font-bold text-stone-800 font-serif tracking-wide">{activeMemo.title}</span>
                        <PenLine size={14} className="text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
                <span className="text-[11px] text-stone-300 ml-2 font-mono pt-1">
                   Last edited: {new Date(activeMemo.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>

            {/* Right: Tools */}
            <div className="flex items-center gap-4">
                
                {/* Formatting Tools */}
                <div className="flex items-center gap-1 bg-stone-100/50 p-1 rounded-lg">
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleInsertCheckbox()}
                        className="p-1.5 text-stone-500 hover:bg-white hover:text-red-800 rounded transition"
                        title="插入核取方塊"
                    >
                        <CheckSquare size={16} />
                    </button>
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleExecCommand('insertUnorderedList')}
                        className="p-1.5 text-stone-500 hover:bg-white hover:text-stone-800 rounded transition"
                        title="項目符號清單"
                    >
                        <List size={16} />
                    </button>
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleExecCommand('insertOrderedList')}
                        className="p-1.5 text-stone-500 hover:bg-white hover:text-stone-800 rounded transition"
                        title="編號清單"
                    >
                        <ListOrdered size={16} />
                    </button>
                    <div className="w-px h-4 bg-stone-200 mx-1"></div>
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleExecCommand('strikeThrough')}
                        className="p-1.5 text-stone-500 hover:bg-white hover:text-stone-800 rounded transition"
                        title="標示為完成 (刪除線)"
                    >
                        <Strikethrough size={16} />
                    </button>
                </div>

                {/* Font Size - Individual Adjustment */}
                <div className="flex items-center gap-1 bg-stone-100/50 p-1 rounded-lg">
                    <button 
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleFontSize('decrease')}
                        className="p-1.5 text-stone-500 hover:bg-white rounded transition"
                        title="縮小字體 (選取文字)"
                    >
                        <Type size={12} />
                    </button>
                    <div className="w-px h-3 bg-stone-200 mx-1"></div>
                    <button 
                         onMouseDown={(e) => e.preventDefault()}
                         onClick={() => handleFontSize('increase')}
                         className="p-1.5 text-stone-500 hover:bg-white rounded transition"
                         title="放大字體 (選取文字)"
                    >
                        <Type size={16} />
                    </button>
                </div>

                <div className="w-px h-4 bg-stone-200"></div>

                {/* Highlighter */}
                <div className="flex items-center gap-1">
                    <Highlighter size={14} className="text-stone-400 mr-1" />
                    {HIGHLIGHT_COLORS.map((hl) => (
                        <button
                            key={hl.label}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyHighlight(hl.color)}
                            className={`w-5 h-5 rounded-full border ${hl.border} shadow-sm hover:scale-110 transition-transform`}
                            style={{ backgroundColor: hl.color === 'transparent' ? '#ffffff' : hl.color }}
                            title={`標記：${hl.label}`}
                        >
                            {hl.color === 'transparent' && <div className="w-full h-full relative"><div className="absolute inset-0 m-auto w-[1px] h-full bg-red-400 rotate-45"></div></div>}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Editor Area */}
        <div 
            className="flex-1 overflow-hidden relative group cursor-text" 
            onClick={(e) => {
                handleEditorClick(e);
                editorRef.current?.focus();
            }}
        >
           <div 
             ref={editorRef}
             contentEditable
             onInput={handleContentChange}
             onKeyDown={(e) => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
                }
             }}
             className={`
                w-full h-full outline-none p-8 md:p-10 overflow-y-auto custom-scrollbar
                text-base
                leading-relaxed text-stone-700
                font-serif tracking-wide
                selection:bg-red-100 selection:text-red-900
                empty:before:content-['開始書寫...'] empty:before:text-stone-300
             `}
             style={{ whiteSpace: 'pre-wrap' }}
           />
        </div>

      </div>
    </motion.div>
  );
};

export default MemoView;