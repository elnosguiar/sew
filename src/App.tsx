import { useEffect, useState } from 'react';
import { AtelierHeader } from './components/AtelierHeader';
import { BottomTabBar } from './components/BottomTabBar';
import { CostCalculator } from './components/CostCalculator';
import { FabricManager } from './components/FabricManager';
import { HomeDashboard } from './components/HomeDashboard';
import { ProjectDraftPreset, ProjectManager } from './components/ProjectManager';
import { SewingToolbox } from './components/SewingToolbox';
import {
  INITIAL_COST_RECORDS,
  INITIAL_FABRICS,
  INITIAL_PROJECTS,
  PROJECT_STATUSES,
} from './data/initialData';
import {
  AtelierBackupPayload,
  CostRecord,
  FabricItem,
  ProjectItem,
  TabId,
} from './types/atelier';
import { getTodayISO } from './utils/formatters';

const STORAGE_KEYS = {
  fabrics: 'sewing_atelier_fabrics_v1',
  projects: 'sewing_atelier_projects_v1',
  costs: 'sewing_atelier_costs_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');

  const [fabrics, setFabrics] = useState<FabricItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.fabrics, INITIAL_FABRICS)
  );
  const [projects, setProjects] = useState<ProjectItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.projects, INITIAL_PROJECTS)
  );
  const [costRecords, setCostRecords] = useState<CostRecord[]>(() =>
    loadFromStorage(STORAGE_KEYS.costs, INITIAL_COST_RECORDS)
  );

  // Sheet states managed here so header/home/toolbox quick actions can open them seamlessly
  const [isFabricSheetOpen, setIsFabricSheetOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState<FabricItem | null>(null);

  const [isProjectSheetOpen, setIsProjectSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [projectDraftPreset, setProjectDraftPreset] =
    useState<ProjectDraftPreset | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.fabrics, JSON.stringify(fabrics));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [fabrics]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [projects]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.costs, JSON.stringify(costRecords));
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [costRecords]);

  // Fabric handlers
  const handleSaveFabric = (
    data: Omit<FabricItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setFabrics((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...data } : item))
      );
    } else {
      const created: FabricItem = {
        ...data,
        id: `fab-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setFabrics((prev) => [created, ...prev]);
    }
  };

  const handleDeleteFabric = (id: string) => {
    setFabrics((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAdjustFabricQuantity = (id: string, delta: number) => {
    setFabrics((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextQty = Math.max(0, Math.round((item.quantity + delta) * 10) / 10);
        return { ...item, quantity: nextQty };
      })
    );
  };

  // Project handlers
  const handleSaveProject = (
    data: Omit<ProjectItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setProjects((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...data } : item))
      );
    } else {
      const created: ProjectItem = {
        ...data,
        id: `prj-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [created, ...prev]);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAdvanceProjectStatus = (id: string) => {
    setProjects((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const idx = PROJECT_STATUSES.indexOf(item.status);
        const nextIdx = (idx + 1) % PROJECT_STATUSES.length;
        const nextStatus = PROJECT_STATUSES[nextIdx];
        return {
          ...item,
          status: nextStatus,
          completedDate: nextStatus === '제작 완료' ? getTodayISO() : undefined,
        };
      })
    );
  };

  const handleToggleChecklistItem = (projectId: string, itemId: string) => {
    setProjects((prev) =>
      prev.map((project) => {
        if (project.id !== projectId || !project.checklist) return project;
        return {
          ...project,
          checklist: project.checklist.map((step) =>
            step.id === itemId ? { ...step, done: !step.done } : step
          ),
        };
      })
    );
  };

  const handleDeductProjectFabric = (projectId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (
      !targetProject ||
      !targetProject.fabricId ||
      !targetProject.usedFabricAmount ||
      targetProject.fabricDeducted
    ) {
      return;
    }

    handleAdjustFabricQuantity(
      targetProject.fabricId,
      -targetProject.usedFabricAmount
    );

    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, fabricDeducted: true } : p
      )
    );
  };

  // Cost record handlers
  const handleSaveCostRecord = (record: Omit<CostRecord, 'id' | 'createdAt'>) => {
    const created: CostRecord = {
      ...record,
      id: `cost-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCostRecords((prev) => [created, ...prev]);
  };

  const handleDeleteCostRecord = (id: string) => {
    setCostRecords((prev) => prev.filter((item) => item.id !== id));
  };

  // Backup Export / Import handlers
  const handleExportBackup = () => {
    const payload: AtelierBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      fabrics,
      projects,
      costRecords,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sewing-atelier-backup-${getTodayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (
    file: File
  ): Promise<{ ok: boolean; message: string }> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<AtelierBackupPayload>;
      if (
        !Array.isArray(parsed.fabrics) ||
        !Array.isArray(parsed.projects) ||
        !Array.isArray(parsed.costRecords)
      ) {
        return {
          ok: false,
          message: '올바른 우리집 미싱실 백업 파일이 아닙니다.',
        };
      }
      setFabrics(parsed.fabrics);
      setProjects(parsed.projects);
      setCostRecords(parsed.costRecords);
      return {
        ok: true,
        message: `복원 완료: 원단 ${parsed.fabrics.length}종, 작업 ${parsed.projects.length}건, 원가 ${parsed.costRecords.length}건`,
      };
    } catch {
      return {
        ok: false,
        message: '백업 파일을 읽는 중 오류가 발생했습니다.',
      };
    }
  };

  // Header & quick action triggers
  const openCreateFabric = () => {
    setActiveTab('fabrics');
    setEditingFabric(null);
    setIsFabricSheetOpen(true);
  };

  const openCreateProject = (preset?: ProjectDraftPreset) => {
    setActiveTab('projects');
    setEditingProject(null);
    setProjectDraftPreset(preset ?? null);
    setIsProjectSheetOpen(true);
  };

  const handleHeaderPrimaryAction = () => {
    if (activeTab === 'fabrics') {
      openCreateFabric();
    } else {
      openCreateProject();
    }
  };

  const handleSelectProjectFromHome = (project: ProjectItem) => {
    setActiveTab('projects');
    setEditingProject(project);
    setProjectDraftPreset(null);
    setIsProjectSheetOpen(true);
  };

  return (
    <div className="min-h-dvh bg-[#FAF9F6] text-[#262320]">
      <AtelierHeader
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onPrimaryAction={handleHeaderPrimaryAction}
      />

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-24 md:px-6 md:pt-8 md:pb-12">
        {activeTab === 'home' && (
          <HomeDashboard
            fabrics={fabrics}
            projects={projects}
            onNavigate={setActiveTab}
            onQuickAddFabric={openCreateFabric}
            onQuickAddProject={() => openCreateProject()}
            onAdvanceProjectStatus={handleAdvanceProjectStatus}
            onSelectProject={handleSelectProjectFromHome}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

        {activeTab === 'fabrics' && (
          <FabricManager
            fabrics={fabrics}
            isSheetOpen={isFabricSheetOpen}
            editingFabric={editingFabric}
            onOpenCreate={() => {
              setEditingFabric(null);
              setIsFabricSheetOpen(true);
            }}
            onOpenEdit={(fabric) => {
              setEditingFabric(fabric);
              setIsFabricSheetOpen(true);
            }}
            onCloseSheet={() => {
              setIsFabricSheetOpen(false);
              setEditingFabric(null);
            }}
            onSaveFabric={handleSaveFabric}
            onDeleteFabric={handleDeleteFabric}
            onAdjustQuantity={handleAdjustFabricQuantity}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectManager
            projects={projects}
            fabrics={fabrics}
            isSheetOpen={isProjectSheetOpen}
            editingProject={editingProject}
            draftPreset={projectDraftPreset}
            onOpenCreate={() => {
              setEditingProject(null);
              setProjectDraftPreset(null);
              setIsProjectSheetOpen(true);
            }}
            onOpenEdit={(project) => {
              setEditingProject(project);
              setProjectDraftPreset(null);
              setIsProjectSheetOpen(true);
            }}
            onCloseSheet={() => {
              setIsProjectSheetOpen(false);
              setEditingProject(null);
              setProjectDraftPreset(null);
            }}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onAdvanceStatus={handleAdvanceProjectStatus}
            onToggleChecklistItem={handleToggleChecklistItem}
            onDeductProjectFabric={handleDeductProjectFabric}
          />
        )}

        {activeTab === 'toolbox' && (
          <SewingToolbox
            onCreateProjectWithSpec={(preset) => openCreateProject(preset)}
          />
        )}

        {activeTab === 'calculator' && (
          <CostCalculator
            fabrics={fabrics}
            records={costRecords}
            onSaveRecord={handleSaveCostRecord}
            onDeleteRecord={handleDeleteCostRecord}
          />
        )}
      </main>

      <BottomTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
