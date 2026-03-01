/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCw, Download, Copy } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DatePicker } from "@/components/DatePicker";
import { toast } from "sonner";

const MAX_CELL_LEN = 24;

function truncate(str: string, max = MAX_CELL_LEN) {
    return str.length > max ? str.slice(0, max) + "…" : str;
}

function CopyCell({ full, display, mono = false, children }: { full: string; display?: string; mono?: boolean; children?: React.ReactNode }) {
    const handleCopy = () => {
        navigator.clipboard.writeText(full);
        toast.success("已复制");
    };
    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span
                        onClick={handleCopy}
                        className={`cursor-pointer select-none group inline-flex items-center gap-1 rounded px-0.5 hover:bg-muted/60 transition-colors${mono ? " font-mono text-xs text-muted-foreground" : ""}`}
                    >
                        {children ?? (display ?? truncate(full))}
                        <Copy className="h-3 w-3 opacity-0 group-hover:opacity-40 shrink-0 transition-opacity" />
                    </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs break-all">
                    {full}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

interface TableLogsViewProps {
    projectId: string;
    tableId: string;
}

export function TableLogsView({ projectId, tableId }: TableLogsViewProps) {
    const [table, setTable] = useState<any>(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterLogId, setFilterLogId] = useState("");
    const [filterMessageType, setFilterMessageType] = useState("all");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    // Export Dialog
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

    const fetchTableAndLogs = async () => {
        try {
            setLoading(true);
            const tRes = await fetch(`/api/tables/${tableId}`);
            const tData = await tRes.json();
            if (tData.code === 200) {
                setTable(tData.data);
            } else {
                toast.error(tData.msg);
                return;
            }

            await fetchLogs(tableId);
        } catch (error) {
            toast.error("获取数据失败");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (currentTableId = tableId) => {
        try {
            const params = new URLSearchParams();
            params.append("tableId", currentTableId);
            if (filterLogId) params.append("logId", filterLogId);
            if (filterMessageType && filterMessageType !== "all") params.append("messageType", filterMessageType);
            if (startDate) params.append("startTime", startDate.toISOString());
            if (endDate) params.append("endTime", endDate.toISOString());

            const res = await fetch(`/api/logs?${params.toString()}`);
            const data = await res.json();
            if (data.code === 200) {
                setLogs(data.data);
            } else {
                toast.error(data.msg);
            }
        } catch (error) {
            toast.error("获取日志失败");
        }
    };

    useEffect(() => {
        if (tableId) {
            fetchTableAndLogs();
        }
    }, [tableId]);

    const handleExportStructure = () => {
        setIsExportDialogOpen(true);
    };

    const handleCopyStructure = () => {
        if (!table) return;
        const columnsObject: Record<string, any> = {};
        table.columns?.forEach((c: any) => {
            if (c.type === 'enum' && c.enumOptions) {
                columnsObject[c.key] = c.enumOptions.map((opt: any) => opt.key);
            } else {
                columnsObject[c.key] = c.type;
            }
        });

        const exportData = {
            columns: columnsObject,
            messageTypes: table.messageTypes?.map((m: any) => m.key)
        };
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
        toast.success("结构已复制到剪贴板");
    };

    if (!table && loading) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">加载中...</div>;
    if (!table) return null;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{table.label} 日志</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportStructure}>
                        <Download className="mr-2 h-4 w-4" /> 导出结构
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                        <RefreshCw className="mr-2 h-4 w-4" /> 刷新
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        placeholder="日志 ID"
                        value={filterLogId}
                        onChange={(e) => setFilterLogId(e.target.value)}
                    />
                    <Select value={filterMessageType} onValueChange={setFilterMessageType}>
                        <SelectTrigger>
                            <SelectValue placeholder="日志类型" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">所有类型</SelectItem>
                            {table.messageTypes?.map((mt: any) => (
                                <SelectItem key={mt.key} value={mt.key}>{mt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <DatePicker date={startDate} setDate={setStartDate} placeholder="开始日期" />
                    <DatePicker date={endDate} setDate={setEndDate} placeholder="结束日期" />
                </div>
                <div className="flex justify-end border-t pt-4 mt-2">
                    <Button onClick={() => fetchLogs()}>应用筛选</Button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">日志 ID</TableHead>
                            <TableHead className="text-center">时间</TableHead>
                            <TableHead className="text-center">日志类型</TableHead>
                            {table.columns?.map((col: any) => (
                                <TableHead className="text-center" key={col.key}>{col.label || col.key}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={table.columns?.length + 3} className="text-center h-32 text-muted-foreground">
                                    暂无日志
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log: any) => (
                                <TableRow key={log._id}>
                                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                        <CopyCell
                                            full={log._id}
                                            mono
                                        />
                                    </TableCell>
                                    <TableCell className="text-center whitespace-nowrap">
                                        <CopyCell
                                            full={format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                                            mono
                                        />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {(() => {
                                            const label = table.messageTypes?.find((mt: any) => mt.key === log.messageType)?.label || log.messageType;
                                            return (
                                                <CopyCell full={label}>
                                                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                                                        {truncate(label, 16)}
                                                    </span>
                                                </CopyCell>
                                            );
                                        })()}
                                    </TableCell>
                                    {table.columns?.map((col: any) => {
                                        const raw = typeof log.data[col.key] === 'object'
                                            ? JSON.stringify(log.data[col.key])
                                            : String(log.data[col.key] ?? '-');
                                        return (
                                            <TableCell className="text-center" key={col.key}>
                                                <CopyCell full={raw} />
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>表结构 ({table.label})</DialogTitle>
                        <DialogDescription>
                            复制以下 JSON 以在前端项目中快速初始化对应表的结构。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative mt-4">
                        <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-x-auto text-sm font-mono max-h-100">
                            {(() => {
                                const columnsObject: Record<string, any> = {};
                                table.columns?.forEach((c: any) => {
                                    if (c.type === 'enum' && c.enumOptions) {
                                        columnsObject[c.key] = c.enumOptions.map((opt: any) => opt.key);
                                    } else {
                                        columnsObject[c.key] = c.type;
                                    }
                                });
                                return JSON.stringify({
                                    columns: columnsObject,
                                    messageTypes: table.messageTypes?.map((m: any) => m.key)
                                }, null, 2);
                            })()}
                        </pre>
                        <Button
                            size="sm"
                            className="absolute top-2 right-6"
                            onClick={handleCopyStructure}
                        >
                            复制
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

