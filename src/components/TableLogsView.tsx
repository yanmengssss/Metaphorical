/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

    if (!table && loading) return <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">加载中...</div>;
    if (!table) return null;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{table.label} 日志</h2>
                <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> 刷新
                </Button>
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
                            <SelectValue placeholder="消息类型" />
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
                            <TableHead className="w-[140px]">时间</TableHead>
                            <TableHead className="w-[120px]">消息类型</TableHead>
                            {table.columns?.map((col: any) => (
                                <TableHead key={col.key}>{col.label || col.key}</TableHead>
                            ))}
                            <TableHead className="text-right w-[100px]">日志 ID</TableHead>
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
                                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                        {format(new Date(log.createdAt), "MM-dd HH:mm:ss")}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                                            {table.messageTypes?.find((mt: any) => mt.key === log.messageType)?.label || log.messageType}
                                        </span>
                                    </TableCell>
                                    {table.columns?.map((col: any) => (
                                        <TableCell key={col.key}>
                                            {typeof log.data[col.key] === 'object'
                                                ? JSON.stringify(log.data[col.key])
                                                : String(log.data[col.key] ?? '-')}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                        {log._id.substring(log._id.length - 6)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

