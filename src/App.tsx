import { useEffect, useState } from 'react';
import { AtelierHeader } from './components/AtelierHeader';
import { BottomTabBar } from './components/BottomTabBar';
import { CostCalculator, CostDraftPreset } from './components/CostCalculator';
import { FabricDraftPreset, FabricManager } from './components/FabricManager';
import {
  ComparisonDraftPreset,
  FabricPriceCompare,
} from './components/FabricPriceCompare';
import { HomeDashboard } from './components/HomeDashboard';
import { ProjectDraftPreset, ProjectManager } from './components/ProjectManager';
import { SewingToolbox } from './components/SewingToolbox';
import {
  ComparisonCalculation,
  INITIAL_FABRIC_COMPARISONS,
} from './data/fabricMalls';
import {
  INITIAL_COST_RECORDS,
  INITIAL_FABRICS,
  INITIAL_PROJECTS,
  PROJECT_STATUSES,
} from './data/initialData';
import {
  AtelierBackupPayload,
  CostRecord,
  FabricComparisonItem,
  FabricItem,
  ProjectItem,
  TabId,
} from './types/atelier';
import { getTodayISO } from './utils/formatters';

const STORAGE_KEYS = {
  fabrics: 'sewing_atelier_fabrics_v1',
  projects: 'sewing_atelier_projects_v1',
  costs: 'sewing_atelier_costs_v1',
  comparisons: 'sewing_atelier_comparisons_v1',
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
  const [comparisons, setComparisons] = useState<FabricComparisonItem[]>(() =>
    loadFromStorage(STORAGE_KEYS.comparisons, INITIAL_FABRIC_COMPARISONS)
  );

  // Sheet states managed here so header/home/toolbox/compare quick actions can open them seamlessly
  const [isFabricSheetOpen, setIsFabricSheetOpen] = useState(false);
  const [editingFabric, setEditingFabric] = useState<FabricItem | null>(null);
  const [fabricDraftPreset, setFabricDraftPreset] =
    useState<FabricDraftPreset | null>(null);

  const [isProjectSheetOpen, setIsProjectSheetOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [projectDraftPreset, setProjectDraftPreset] =
    useState<ProjectDraftPreset | null>(null);

  const [isCompareSheetOpen, setIsCompareSheetOpen] = useState(false);
  const [editingComparison, setEditingComparison] =
    useState<FabricComparisonItem | null>(null);
  const [compareDraftPreset, setCompareDraftPreset] =
    useState<ComparisonDraftPreset | null>(null);

  const [costDraftPreset, setCostDraftPreset] =
    useState<CostDraftPreset | null>(null);

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

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.comparisons,
        JSON.stringify(comparisons)
      );
    } catch {
      // Ignore quota exceeded gracefully
    }
  }, [comparisons]);

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

  // Price comparison handlers
  const handleSaveComparison = (
    data: Omit<FabricComparisonItem, 'id' | 'createdAt'>,
    existingId?: string
  ) => {
    if (existingId) {
      setComparisons((prev) =>
        prev.map((item) => (item.id === existingId ? { ...item, ...data } : item))
      );
    } else {
      const created: FabricComparisonItem = {
        ...data,
        id: `cmp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        createdAt: new Date().toISOString(),
      };
      setComparisons((prev) => [created, ...prev]);
    }
  };

  const handleDeleteComparison = (id: string) => {
    setComparisons((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetComparisonSamples = () => {
    setComparisons(INITIAL_FABRIC_COMPARISONS);
  };

  const handleSendComparisonToInventory = (
    item: FabricComparisonItem,
    metrics: ComparisonCalculation,
    neededYards: number
  ) => {
    setActiveTab('fabrics');
    setEditingFabric(null);
    setFabricDraftPreset({
      name: item.fabricName,
      quantity: neededYards,
      unit: '마',
      widthCm: item.widthCm,
      price: metrics.effectiveTotal,
      note: `${item.mallName} 구매${item.note ? ` · ${item.note}` : ''}`,
    });
    setIsFabricSheetOpen(true);
  };

  const handleSendComparisonToCalculator = (
    item: FabricComparisonItem,
    metrics: ComparisonCalculation,
    neededYards: number
  ) => {
    setCostDraftPreset({
      id: `${item.id}-${Date.now()}`,
      title: `${item.fabricName} (${neededYards}마 · ${item.mallName})`,
      fabricCost: metrics.effectiveTotal,
    });
    setActiveTab('calculator');
  };

  // Backup Export / Import handlers
  const handleExportBackup = () => {
    const payload: AtelierBackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      fabrics,
      projects,
      costRecords,
      comparisons,
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
      if (Array.isArray(parsed.comparisons)) {
        setComparisons(parsed.comparisons);
      }
      const compareText = Array.isArray(parsed.comparisons)
        ? `, 가격비교 ${parsed.comparisons.length}건`
        : '';
      return {
        ok: true,
        message: `복원 완료: 원단 ${parsed.fabrics.length}종, 작업 ${parsed.projects.length}건, 원가 ${parsed.costRecords.length}건${compareText}`,
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
    setFabricDraftPreset(null);
    setIsFabricSheetOpen(true);
  };

  const openCreateProject = (preset?: ProjectDraftPreset) => {
    setActiveTab('projects');
    setEditingProject(null);
    setProjectDraftPreset(preset ?? null);
    setIsProjectSheetOpen(true);
  };

  const openCreateComparison = (preset?: ComparisonDraftPreset) => {
    setActiveTab('compare');
    setEditingComparison(null);
    setCompareDraftPreset(preset ?? null);
    setIsCompareSheetOpen(true);
  };

  const handleHeaderPrimaryAction = () => {
    if (activeTab === 'compare') {
      openCreateComparison();
    } else if (activeTab === 'fabrics') {
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

        {activeTab === 'compare' && (
          <FabricPriceCompare
            comparisons={comparisons}
            isSheetOpen={isCompareSheetOpen}
            editingItem={editingComparison}
            draftPreset={compareDraftPreset}
            onOpenCreate={openCreateComparison}
            onOpenEdit={(item) => {
              setEditingComparison(item);
              setCompareDraftPreset(null);
              setIsCompareSheetOpen(true);
            }}
            onCloseSheet={() => {
              setIsCompareSheetOpen(false);
              setEditingComparison(null);
              setCompareDraftPreset(null);
            }}
            onSaveComparison={handleSaveComparison}
            onDeleteComparison={handleDeleteComparison}
            onResetSamples={handleResetComparisonSamples}
            onSendToInventory={handleSendComparisonToInventory}
            onSendToCalculator={handleSendComparisonToCalculator}
          />
        )}

        {activeTab === 'fabrics' && (
          <FabricManager
            fabrics={fabrics}
            isSheetOpen={isFabricSheetOpen}
            editingFabric={editingFabric}
            draftPreset={fabricDraftPreset}
            onOpenCreate={() => {
              setEditingFabric(null);
              setFabricDraftPreset(null);
              setIsFabricSheetOpen(true);
            }}
            onOpenEdit={(fabric) => {
              setEditingFabric(fabric);
              setFabricDraftPreset(null);
              setIsFabricSheetOpen(true);
            }}
            onCloseSheet={() => {
              setIsFabricSheetOpen(false);
              setEditingFabric(null);
              setFabricDraftPreset(null);
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
            draftPreset={costDraftPreset}
            onSaveRecord={handleSaveCostRecord}
            onDeleteRecord={handleDeleteCostRecord}
          />
        )}
      </main>

      <BottomTabBar activeTab={activeTab} onSelectTab={setActiveTab} />
    </div>
  );
}
