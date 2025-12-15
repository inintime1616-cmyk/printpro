import React, { useState, useEffect } from 'react';
import { Project, ViewType } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import WorkspaceView from './components/WorkspaceView';
import ArchivedView from './components/ArchivedView';
import ProjectModal from './components/ProjectModal';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [appTitle, setAppTitle] = useState('PrintFlow Pro');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    const savedProjects = localStorage.getItem('printProjectSystem_v1');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      // Default initial data
      setProjects([{
        id: Date.now(),
        name: '範例：2024 夏季新品海報',
        deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
        tags: ['數位印刷', '燙金'],
        archived: false,
        stages: [{ name: '設計完稿', deadline: '2023-10-01', completed: true }, { name: '打樣確認', deadline: '', completed: false }]
      }]);
    }

    const savedTags = localStorage.getItem('printProjectSystem_allTags');
    if (savedTags) {
      setAvailableTags(JSON.parse(savedTags));
    } else {
      setAvailableTags(['數位印刷', '燙金', '凸版', 'UV 浮雕', '斬型', '後加工']);
    }

    const savedTitle = localStorage.getItem('printProjectSystem_appTitle');
    if (savedTitle) {
      setAppTitle(savedTitle);
    }
  }, []);

  // Save data
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('printProjectSystem_v1', JSON.stringify(projects));
    }
  }, [projects]);

  useEffect(() => {
    if (availableTags.length > 0) {
      localStorage.setItem('printProjectSystem_allTags', JSON.stringify(availableTags));
    }
  }, [availableTags]);

  useEffect(() => {
    localStorage.setItem('printProjectSystem_appTitle', appTitle);
  }, [appTitle]);

  const handleSaveProject = (projectData: Partial<Project>) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...projectData } as Project : p));
    } else {
      const newProject: Project = {
        ...(projectData as Project),
        id: Date.now(),
        archived: false,
        stages: projectData.stages || []
      };
      setProjects(prev => [...prev, newProject]);
    }
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (id: number) => {
    if (window.confirm('確定要刪除此專案嗎？')) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleArchive = (project: Project) => {
    if (!project.archived && !window.confirm('確定要將此專案「結案歸檔」嗎？')) return;
    
    setProjects(prev => prev.map(p => 
      p.id === project.id ? { ...p, archived: !p.archived } : p
    ));
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const openNewProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleAddGlobalTag = (tag: string) => {
    if (!availableTags.includes(tag)) {
      setAvailableTags(prev => [...prev, tag]);
    }
  };

  const handleDeleteGlobalTag = (tag: string) => {
     if(window.confirm(`確定要從常用標籤中移除「${tag}」嗎？`)) {
        setAvailableTags(prev => prev.filter(t => t !== tag));
     }
  };

  const handleClearArchived = () => {
    setProjects(prev => prev.filter(p => !p.archived));
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-800">
      <Header 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onNewProject={openNewProject}
        title={appTitle}
        onTitleChange={setAppTitle}
      />

      <main>
        {currentView === 'dashboard' && (
          <Dashboard 
            projects={projects} 
            onEdit={openEditProject} 
            onArchive={handleToggleArchive} 
            onDelete={handleDeleteProject}
            onUpdate={handleUpdateProject}
          />
        )}
        {currentView === 'calendar' && (
          <CalendarView projects={projects} onEdit={openEditProject} />
        )}
        {currentView === 'workspace' && (
          <WorkspaceView projects={projects} onEdit={openEditProject} />
        )}
        {currentView === 'archived' && (
          <ArchivedView 
            projects={projects} 
            onUnarchive={handleToggleArchive} 
            onDelete={handleDeleteProject}
            onClearAll={handleClearArchived}
          />
        )}
      </main>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveProject}
        initialData={editingProject}
        availableTags={availableTags}
        onAddGlobalTag={handleAddGlobalTag}
        onDeleteGlobalTag={handleDeleteGlobalTag}
      />
    </div>
  );
};

export default App;