/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Copy, Eye, Ban, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Project {
  _id: string;
  name: string;
  key: string;
  status: "active" | "banned";
  createdAt: string;
}

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onUpdate: () => void;
}

export function ProjectList({ projects, loading, onUpdate }: ProjectListProps) {
  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "banned" : "active";
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.code === 200) {
        toast.success(`项目已${newStatus === "active" ? "解封" : "封禁"}`);
        onUpdate();
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("更新项目状态失败");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("密钥已复制到剪贴板");
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">暂无项目</h3>
        <p className="mt-1 text-sm text-gray-500">创建一个新项目以开始使用</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project._id} className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {project.name}
            </CardTitle>
            <Badge variant={project.status === "active" ? "default" : "destructive"}>
              {project.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-4">
              创建于 {format(new Date(project.createdAt), "PP")}
            </div>
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500">项目密钥</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-slate-100 p-1.5 text-xs font-mono truncate">
                  {project.key}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => copyKey(project.key)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Link href={`/projects/${project._id}`} passHref>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                查看数据
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={project.status === "active" ? "text-red-600 hover:text-red-700 hover:bg-red-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
              onClick={() => handleStatusChange(project._id, project.status)}
            >
              {project.status === "active" ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  封禁
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  解封
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

