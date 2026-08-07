"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { AuditLog } from "@tech-survivor/types";
import { apiClient } from "@/lib/apiClient";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function useAuditLogs(limit: number) {
  return useQuery({
    queryKey: ["admin", "audit-logs", limit],
    queryFn: () => apiClient.get<AuditLog[]>(`/admin/audit-logs?limit=${limit}`),
  });
}

function DetailsRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = useState(false);
  const hasDetails = Object.keys(log.details ?? {}).length > 0;

  return (
    <>
      <tr>
        <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
        <td className="px-4 py-3 text-slate-600">{log.actorEmail}</td>
        <td className="px-4 py-3 font-medium text-navy-900">{log.action}</td>
        <td className="px-4 py-3 text-slate-600">{log.targetType}</td>
        <td className="px-4 py-3 font-mono text-xs text-slate-500">{log.targetId ?? "—"}</td>
        <td className="px-4 py-3">
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex items-center gap-1 text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              {open ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
              {open ? "Hide" : "View"} details
            </button>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
      </tr>
      {open && hasDetails && (
        <tr>
          <td colSpan={6} className="bg-slate-50 px-4 py-3">
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-700">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLogsPage() {
  const [limit, setLimit] = useState(100);
  const query = useAuditLogs(limit);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Audit Logs</h1>
          <p className="text-sm text-slate-500">Read-only, most recent action first.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="limit">Show</Label>
          <Select id="limit" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="w-32">
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
          </Select>
        </div>
      </div>

      {query.isError && <Alert variant="error">Could not load audit logs.</Alert>}
      {query.isLoading && <Skeleton className="h-96 w-full" />}

      {query.data && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Timestamp</th>
                  <th scope="col" className="px-4 py-3">Actor</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                  <th scope="col" className="px-4 py-3">Target Type</th>
                  <th scope="col" className="px-4 py-3">Target ID</th>
                  <th scope="col" className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {query.data.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No audit log entries yet.</td></tr>
                )}
                {query.data.map((log) => <DetailsRow key={log.id} log={log} />)}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
