/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCw } from "lucide-react";
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
              <TableHead className="w-[150px]">Project</TableHead>
              <TableHead className="w-[150px]">Table</TableHead>
              <TableHead className="w-[180px]">Time</TableHead>
              <TableHead>Content (JSON)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: any) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium">
                    {log.project?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.table?.label || log.table?.key || "Unknown"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
                  </TableCell>
                  <TableCell className="font-mono text-xs break-all">
                    {JSON.stringify(log.data)}
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

