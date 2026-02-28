/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
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

interface EditProjectDialogProps {
    project: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function EditProjectDialog({
    project,
    open,
    onOpenChange,
    onSuccess,
}: EditProjectDialogProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (project && open) {
            setName(project.name);
        }
    }, [project, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !project) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${project._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const data = await res.json();

            if (data.code === 200) {
                toast.success("项目更新成功");
                onSuccess();
                onOpenChange(false);
            } else {
                toast.error(data.msg);
            }
        } catch (error) {
            toast.error("更新项目失败");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>编辑项目</DialogTitle>
                    <DialogDescription>
                        修改项目名称
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                名称
                            </Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="项目名称"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "保存中..." : "保存"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

