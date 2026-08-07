"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Award,
  CheckCircle2,
  Code2,
  FileCheck2,
  ListChecks,
  UserCheck,
  UserX,
  Users,
  Users2,
} from "lucide-react";
import type { Verdict } from "@tech-survivor/types";
import { apiClient } from "@/lib/apiClient";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/stat-card";
import { CHART_COLORS, VERDICT_CHART_COLORS, VERDICT_CHART_LABELS } from "@/lib/chartColors";

interface DashboardResponse {
  totalRegistrations: number;
  verifiedParticipants: number;
  round1Started: number;
  round1Submitted: number;
  qualifiedParticipants: number;
  round2Participants: number;
  codeSubmissions: number;
  acceptedSubmissions: number;
  activeParticipants: number;
  disqualifiedParticipants: number;
  charts: {
    registrationTrend: { date: string; count: number }[];
    mcqScoreDistribution: { scoreRange: string; count: number }[];
    qualificationRate: { qualified: number; notQualified: number; pending: number };
    languageUsage: { language: string; count: number }[];
    problemSuccessRate: { problemId: string; title: string; attempts: number; accepted: number; successRate: number }[];
    verdictDistribution: { verdict: Verdict; count: number }[];
    submissionActivity: { date: string; count: number }[];
  };
}

function useDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiClient.get<DashboardResponse>("/admin/dashboard"),
    refetchInterval: 30_000,
  });
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <p className="flex h-full items-center justify-center text-sm text-slate-400">{label}</p>;
}

const QUALIFICATION_COLORS = {
  qualified: CHART_COLORS.green,
  notQualified: CHART_COLORS.red,
  pending: CHART_COLORS.amber,
};

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Live overview of registrations, rounds, and submissions.</p>
      </div>

      {isError && <Alert variant="error">Could not load dashboard data. Try refreshing the page.</Alert>}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Registrations" value={data.totalRegistrations} icon={Users} accent="blue" />
            <StatCard label="Verified Participants" value={data.verifiedParticipants} icon={UserCheck} accent="blue" />
            <StatCard label="Round 1 Started" value={data.round1Started} icon={ListChecks} accent="purple" />
            <StatCard label="Round 1 Submitted" value={data.round1Submitted} icon={FileCheck2} accent="purple" />
            <StatCard label="Qualified for Round 2" value={data.qualifiedParticipants} icon={Award} accent="green" />
            <StatCard label="Round 2 Participants" value={data.round2Participants} icon={Users2} accent="green" />
            <StatCard label="Code Submissions" value={data.codeSubmissions} icon={Code2} accent="blue" />
            <StatCard label="Accepted Submissions" value={data.acceptedSubmissions} icon={CheckCircle2} accent="green" />
            <StatCard label="Active Participants" value={data.activeParticipants} accent="blue" icon={Users} />
            <StatCard label="Disqualified" value={data.disqualifiedParticipants} icon={UserX} accent="amber" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title="Registration Trend">
              {data.charts.registrationTrend.length === 0 ? (
                <EmptyChart label="No registrations yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.registrationTrend} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" width={32} />
                    <Tooltip formatter={(value: number) => [value, "Registrations"]} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Registrations"
                      stroke={CHART_COLORS.blue}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="MCQ Score Distribution">
              {data.charts.mcqScoreDistribution.every((b) => b.count === 0) ? (
                <EmptyChart label="No finalized Round 1 attempts yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.mcqScoreDistribution} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="scoreRange" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" width={32} />
                    <Tooltip formatter={(value: number) => [value, "Participants"]} />
                    <Bar dataKey="count" name="Participants" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Qualification Rate">
              {(() => {
                const rows = [
                  { key: "qualified", label: "Qualified", value: data.charts.qualificationRate.qualified },
                  { key: "notQualified", label: "Not Qualified", value: data.charts.qualificationRate.notQualified },
                  { key: "pending", label: "Pending", value: data.charts.qualificationRate.pending },
                ];
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" width={90} />
                      <Tooltip />
                      <Bar dataKey="value" name="Participants" radius={[0, 4, 4, 0]}>
                        {rows.map((row) => (
                          <Cell key={row.key} fill={QUALIFICATION_COLORS[row.key as keyof typeof QUALIFICATION_COLORS]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </ChartCard>

            <ChartCard title="Language Usage">
              {data.charts.languageUsage.length === 0 ? (
                <EmptyChart label="No code submissions yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.charts.languageUsage} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="language" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" width={32} />
                    <Tooltip formatter={(value: number) => [value, "Submissions"]} />
                    <Bar dataKey="count" name="Submissions" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Per-Problem Success Rate">
              {data.charts.problemSuccessRate.length === 0 ? (
                <EmptyChart label="No coding problems yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.charts.problemSuccessRate}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                      width={110}
                      tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 16)}…` : value)}
                    />
                    <Tooltip
                      formatter={(value: number, _name, item) => [
                        `${value}% (${item.payload.accepted}/${item.payload.attempts})`,
                        "Success rate",
                      ]}
                    />
                    <Bar dataKey="successRate" name="Success rate" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Verdict Distribution">
              {data.charts.verdictDistribution.length === 0 ? (
                <EmptyChart label="No judged submissions yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.charts.verdictDistribution.map((v) => ({ ...v, label: VERDICT_CHART_LABELS[v.verdict] }))}
                    layout="vertical"
                    margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" width={130} />
                    <Tooltip />
                    <Bar dataKey="count" name="Submissions" radius={[0, 4, 4, 0]}>
                      {data.charts.verdictDistribution.map((v) => (
                        <Cell key={v.verdict} fill={VERDICT_CHART_COLORS[v.verdict]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard title="Submission Activity">
              {data.charts.submissionActivity.length === 0 ? (
                <EmptyChart label="No submissions yet." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.charts.submissionActivity} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" width={32} />
                    <Tooltip formatter={(value: number) => [value, "Submissions"]} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Submissions"
                      stroke={CHART_COLORS.green}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
