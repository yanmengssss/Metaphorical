/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Eye, Edit, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Table {
  _id: string;
  key: string;
  label: string;
  messageTypes: { key: string; label: string }[];
  columns: { key: string; type: string }[];
  createdAt: string;
}

interface TableListProps {
  tables: Table[];
  projectId: string;
  loading: boolean;
  onUpdate: () => void;
  onEdit?: (table: Table) => void;
}

export function TableList({ tables, projectId, loading, onEdit }: TableListProps) {
  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <TableIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No tables</h3>
        <p className="mt-1 text-sm text-gray-500">Create a table to start reporting logs.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tables.map((table) => (
        <Card key={table._id} className="bg-white hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium truncate" title={table.label}>
              {table.label}
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">
              {table.key}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-4">
              Created {format(new Date(table.createdAt), "PP")}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Message Types:</span>
                <span className="font-medium">{table.messageTypes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Columns:</span>
                <span className="font-medium">{table.columns.length}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit?.(table)}>
              <Edit className="h-4 w-4" />
            </Button>

            <Link href={`/?projectId=${projectId}&tableId=${table._id}`} passHref>
              <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View Logs
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

