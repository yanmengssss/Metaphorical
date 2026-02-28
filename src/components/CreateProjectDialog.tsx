/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdProject, setCreatedProject] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (data.code === 200) {
        toast.success("项目创建成功");
        setCreatedProject(data.data);
        onSuccess();
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("创建项目失败");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCreatedProject(null);
      setName("");
    }, 300);
  };

  const copyKey = () => {
    if (createdProject?.key) {
      navigator.clipboard.writeText(createdProject.key);
      toast.success("密钥已复制到剪贴板");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建项目</DialogTitle>
          <DialogDescription>
            输入项目名称以生成唯一的连接密钥。
          </DialogDescription>
        </DialogHeader>

        {!createdProject ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  名称
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="项目名称"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">项目已创建！</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>这是您的项目密钥。请妥善保管。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>项目密钥</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-slate-100 p-2 text-sm font-mono break-all">
                  {createdProject.key}
                </code>
                <Button size="icon" variant="outline" onClick={copyKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>完成</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

