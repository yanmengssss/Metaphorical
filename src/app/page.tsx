/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Settings, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { EditProjectDialog } from "@/components/EditProjectDialog";
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { EditTableDialog } from "@/components/EditTableDialog";
import { ProjectList } from "@/components/ProjectList";
import { TableList } from "@/components/TableList";
import { TableLogsView } from "@/components/TableLogsView";
import { toast } from "sonner";
import { apiFetch } from "@/lib/auth-client";

function DashboardContent() {
  const searchParams = useSearchParams();

  const projectId = searchParams.get("projectId") || "";
  const tableId = searchParams.get("tableId") || "";

  const [projects, setProjects] = useState<any[]>([]);
  const [tableResult, setTableResult] = useState<{ projectId: string; tables: any[] }>({ projectId: "", tables: [] });
  const tables = tableResult.projectId === projectId ? tableResult.tables : [];
  const tableRequest = useRef<AbortController | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isCreateTableOpen, setIsCreateTableOpen] = useState(false);
  const [isEditTableOpen, setIsEditTableOpen] = useState(false);
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<any>(null);

  const activeProject = projects.find(p => p._id === projectId);
  const activeTable = tables.find(t => t._id === tableId);

  // Fetch projects on mount
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const res = await apiFetch("/api/projects");
      const data = await res.json();
      if (data.code === 200) {
        setProjects(data.data);
      }
    } catch (error) {
      toast.error("获取项目失败");
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch tables when project changes
  const fetchTables = async (pId: string) => {
    tableRequest.current?.abort();
    const controller = new AbortController();
    tableRequest.current = controller;
    if (!pId) {
      setTableResult({ projectId: "", tables: [] });
      setLoadingTables(false);
      return;
    }
    try {
      setLoadingTables(true);
      const res = await apiFetch(`/api/projects/${pId}/tables`, { signal: controller.signal });
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code === 200) {
        setTableResult({ projectId: pId, tables: data.data });
      } else {
        setTableResult({ projectId: pId, tables: [] });
        toast.error(data.msg || "获取表失败");
      }
    } catch (error) {
      if (!controller.signal.aborted) toast.error("获取表失败");
    } finally {
      if (!controller.signal.aborted) setLoadingTables(false);
    }
  };

  useEffect(() => {
    fetchTables(projectId);
    return () => tableRequest.current?.abort();
  }, [projectId]);

  // These selections only filter client data; avoid waiting for a server navigation.
  const updateSelection = (nextProjectId: string, nextTableId = "") => {
    const url = new URL(window.location.href);
    url.searchParams.delete("projectId");
    url.searchParams.delete("tableId");
    if (nextProjectId) url.searchParams.set("projectId", nextProjectId);
    if (nextProjectId && nextTableId) url.searchParams.set("tableId", nextTableId);
    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
    setSelectedTableForEdit(null);
    setIsEditTableOpen(false);
    setIsEditProjectOpen(false);
  };

  const handleProjectChange = (val: string) => {
    updateSelection(val === "all" ? "" : val);
  };

  const handleTableChange = (val: string) => {
    updateSelection(projectId, val === "all" ? "" : val);
  };

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">选择项目</span>
            <Select value={projectId || "all"} onValueChange={handleProjectChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择项目..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- 所有项目 --</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 border-l pl-4 ml-2">选择表</span>
            <Select value={tableId || "all"} onValueChange={handleTableChange} disabled={!projectId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择数据表..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">-- 所有表 --</SelectItem>
                {tables.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {projectId && activeProject ? (
            <Button variant="outline" onClick={() => setIsEditProjectOpen(true)}>
              <Settings className="mr-2 h-4 w-4" /> 编辑项目
            </Button>
          ) : (
            <Button onClick={() => setIsCreateProjectOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 创建项目
            </Button>
          )}

          {tableId && activeTable && (
            <Button variant="outline" onClick={() => setIsEditTableOpen(true)}>
              <FileEdit className="mr-2 h-4 w-4" /> 编辑表
            </Button>
          )}
          {projectId && !tableId && (
            <Button onClick={() => setIsCreateTableOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> 创建表
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50/50 p-6 min-h-[500px] px-0">
        {!projectId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">所有项目</h2>
            </div>
            <ProjectList
              projects={projects}
              loading={loadingProjects}
              onUpdate={fetchProjects}
            />
          </div>
        ) : !tableId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">{activeProject?.name} 的数据表</h2>
            </div>
            <TableList
              tables={tables}
              projectId={projectId}
              loading={loadingTables}
              onUpdate={() => fetchTables(projectId)}
              onEdit={(table) => {
                setSelectedTableForEdit(table);
                setIsEditTableOpen(true);
              }}
            />
          </div>
        ) : (
          <TableLogsView key={`${projectId}:${tableId}`} projectId={projectId} tableId={tableId} />
        )}
      </div>

      <CreateProjectDialog
        open={isCreateProjectOpen}
        onOpenChange={setIsCreateProjectOpen}
        onSuccess={fetchProjects}
      />
      {activeProject && (
        <EditProjectDialog
          project={activeProject}
          open={isEditProjectOpen}
          onOpenChange={setIsEditProjectOpen}
          onSuccess={fetchProjects}
        />
      )}
      <CreateTableDialog
        projectId={projectId}
        open={isCreateTableOpen}
        onOpenChange={setIsCreateTableOpen}
        onSuccess={() => fetchTables(projectId)}
      />
      {(activeTable || selectedTableForEdit) && (
        <EditTableDialog
          table={activeTable || selectedTableForEdit}
          open={isEditTableOpen}
          onOpenChange={(open) => {
            setIsEditTableOpen(open);
            if (!open) setSelectedTableForEdit(null);
          }}
          onSuccess={() => fetchTables(projectId)}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 animate-pulse">加载中...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
