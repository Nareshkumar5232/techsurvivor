"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";
import { firebaseAuth } from "@/lib/firebaseClient";
import { downloadBlob } from "@/lib/download";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const EXPORTS = [
  { type: "participants", label: "Participants", description: "Every registered participant, their institution, status, and disqualification flag." },
  { type: "round1", label: "Round 1 Results", description: "Every Round 1 attempt with score, percentage, and qualification outcome." },
  { type: "qualified", label: "Round 1 Qualified Only", description: "Same as Round 1 Results, filtered to qualified participants." },
  { type: "submissions", label: "Submissions", description: "Every Round 2 code submission with verdict, tests passed, and score." },
  { type: "leaderboard", label: "Leaderboard", description: "The live leaderboard, including disqualified participants." },
] as const;

/** Downloads are CSV files, not JSON, so `apiClient` (which always parses the response as
 *  JSON) doesn't fit here - this replicates apiClient's auth header pattern directly against
 *  fetch and reads the response as a blob instead. */
async function fetchExportBlob(type: string): Promise<{ blob: Blob; filename: string }> {
  const user = firebaseAuth.currentUser;
  const headers: Record<string, string> = {};
  if (user) {
    const token = await user.getIdToken();
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/admin/results/export?type=${type}`, { headers });
  if (!response.ok) {
    let message = `Export failed (HTTP ${response.status})`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) message = body.error.message;
    } catch {
      // Response wasn't JSON (e.g. the CSV itself, or empty) - keep the generic message.
    }
    throw new Error(message);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);
  const filename = match?.[1] ?? `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
  return { blob: await response.blob(), filename };
}

export default function ExportCenterPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExport(type: string, label: string) {
    setLoading(type);
    try {
      const { blob, filename } = await fetchExportBlob(type);
      downloadBlob(filename, blob);
      toast.success(`${label} export downloaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Export Center</h1>
        <p className="text-sm text-slate-500">Download CSV snapshots of event data for offline review or record-keeping.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORTS.map((item) => (
          <Card key={item.type}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                <CardTitle className="text-base">{item.label}</CardTitle>
              </div>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleExport(item.type, item.label)}
                disabled={loading === item.type}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {loading === item.type ? "Downloading..." : "Download CSV"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
