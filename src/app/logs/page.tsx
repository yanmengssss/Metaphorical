/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCw, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const MAX_CELL_LEN = 28;

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

export default function GlobalLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterLogId, setFilterLogId] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterLogId) params.append("logId", filterLogId);
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
      toast.error("Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Global Logs</h1>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Log ID"
            value={filterLogId}
            onChange={(e) => setFilterLogId(e.target.value)}
          />
          <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />
          <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />
          <div className="flex justify-end md:col-start-4">
            <Button onClick={fetchLogs} className="w-full">Apply Filters</Button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center w-[120px]">日志 ID</TableHead>
              <TableHead className="text-center w-[150px]">Project</TableHead>
              <TableHead className="text-center w-[150px]">Table</TableHead>
              <TableHead className="text-center w-[180px]">Time</TableHead>
              <TableHead className="text-center">Content (JSON)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log._id}>
                  <TableCell className="text-center">
                    <CopyCell full={log._id} mono />
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    <CopyCell full={log.project?.name || "Unknown"} />
                  </TableCell>
                  <TableCell className="text-center">
                    <CopyCell full={log.table?.label || log.table?.key || "Unknown"}>
                      <Badge variant="outline">{truncate(log.table?.label || log.table?.key || "Unknown", 16)}</Badge>
                    </CopyCell>
                  </TableCell>
                  <TableCell className="text-center">
                    <CopyCell
                      full={format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                      mono
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <CopyCell full={JSON.stringify(log.data)} mono />
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

